"""
WebSocket Connection Manager

Manages WebSocket connections for real-time research progress events.
Multiple clients can subscribe to the same session_id.

Usage (from the orchestrator or research pipeline):
    from app.core.dependencies import get_websocket_manager
    ws_manager = get_websocket_manager()
    await ws_manager.broadcast(session_id, {"type": "step_completed", ...})
"""

from datetime import datetime, date
from uuid import UUID
from enum import Enum
import json
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

from app.core.logging import get_logger

logger = get_logger(__name__)


def json_serial(obj: Any) -> Any:
    """Recursively convert objects (datetime, UUID, Enum, Pydantic models, dicts, lists) to JSON primitives."""
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, Enum):
        return obj.value
    if hasattr(obj, "model_dump"):
        return json_serial(obj.model_dump(mode="json"))
    if hasattr(obj, "dict"):
        return json_serial(obj.dict())
    if isinstance(obj, dict):
        return {str(k): json_serial(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [json_serial(item) for item in obj]
    return str(obj)


class WebSocketManager:
    """
    Manages active WebSocket connections grouped by research session_id.

    Thread-safety note: In production with multiple workers, use Redis
    pub/sub or a message broker to broadcast across worker processes.
    """

    def __init__(self) -> None:
        # Maps session_id -> set of active WebSocket connections
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

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

        disconnected: list[WebSocket] = []
        try:
            sanitized_message = json_serial(message)
            payload = json.dumps(sanitized_message, default=str)
        except Exception as e:
            logger.error("Failed to JSON-serialize WebSocket message", session_id=session_id, error=str(e))
            return

        for websocket in self._connections[session_id]:
            try:
                await websocket.send_text(payload)
            except Exception as e:  # noqa: BLE001
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
