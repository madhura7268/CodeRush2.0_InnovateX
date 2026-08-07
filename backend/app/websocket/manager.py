"""
WebSocket Connection Manager

Manages WebSocket connections for real-time research progress events.
Multiple clients can subscribe to the same session_id.

Usage (from the orchestrator or research pipeline):
    from app.core.dependencies import get_websocket_manager
    ws_manager = get_websocket_manager()
    await ws_manager.broadcast(session_id, {"type": "step_completed", ...})
"""

import json
from collections import defaultdict
from typing import Dict, List, Set

from fastapi import WebSocket

from app.core.logging import get_logger

logger = get_logger(__name__)


class WebSocketManager:
    """
    Manages active WebSocket connections grouped by research session_id.

    Thread-safety note: In production with multiple workers, use Redis
    pub/sub or a message broker to broadcast across worker processes.
    """

    def __init__(self) -> None:
        # Maps session_id -> set of active WebSocket connections
        self._connections: Dict[str, Set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, session_id: str) -> None:
        """Accept a WebSocket connection and register it for a session."""
        await websocket.accept()
        self._connections[session_id].add(websocket)
        logger.info(
            "WebSocket connected",
            session_id=session_id,
            total_connections=len(self._connections[session_id]),
        )

    def disconnect(self, websocket: WebSocket, session_id: str) -> None:
        """Remove a WebSocket connection when client disconnects."""
        self._connections[session_id].discard(websocket)
        if not self._connections[session_id]:
            del self._connections[session_id]
        logger.info("WebSocket disconnected", session_id=session_id)

    async def broadcast(self, session_id: str, message: dict) -> None:
        """
        Send a JSON message to all clients subscribed to a session.

        Args:
            session_id: The research session to broadcast to.
            message: The event payload (will be JSON-serialized).
        """
        if session_id not in self._connections:
            return

        disconnected: List[WebSocket] = []
        payload = json.dumps(message)

        for websocket in self._connections[session_id]:
            try:
                await websocket.send_text(payload)
            except Exception as e:
                logger.warning(
                    "Failed to send WebSocket message",
                    session_id=session_id,
                    error=str(e),
                )
                disconnected.append(websocket)

        # Clean up dead connections
        for ws in disconnected:
            self.disconnect(ws, session_id)

    def get_connection_count(self, session_id: str) -> int:
        """Return the number of active connections for a session."""
        return len(self._connections.get(session_id, set()))
