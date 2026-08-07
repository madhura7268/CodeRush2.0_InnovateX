"""
Tests for the Report Generator
"""

import pytest
from unittest.mock import AsyncMock
from app.research.report_generator import ReportGenerator
from app.interfaces.memory import IMemory

@pytest.mark.asyncio
async def test_report_generator():
    """Verify report generation compiles findings and metadata correctly."""
    memory = AsyncMock(spec=IMemory)
    memory.get_session_context.return_value = {
        "session_id": "test-session",
        "question": "What is quantum computing?",
        "findings": [],
        "tool_call_history": [],
        "overall_confidence": 0.85,
    }
    
    generator = ReportGenerator(memory=memory)
    report = await generator.generate_report("test-session")
    
    assert report.session_id == "test-session"
    assert report.question == "What is quantum computing?"
    assert report.overall_confidence == 0.85
    assert "quantum computing" in report.executive_summary.lower()
