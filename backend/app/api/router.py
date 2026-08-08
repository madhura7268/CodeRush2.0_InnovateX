"""
Central API Router

Aggregates all module routers and mounts them under /api.
"""

from fastapi import APIRouter

from app.api import auth, evaluation, governance, health, planner, report, research

api_router = APIRouter()

# Register all module routers
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(research.router, prefix="/research", tags=["Research"])
api_router.include_router(planner.router, prefix="/planner", tags=["Planner"])
api_router.include_router(governance.router, prefix="/governance", tags=["Governance"])
api_router.include_router(evaluation.router, prefix="/evaluation", tags=["Evaluation"])
api_router.include_router(report.router, prefix="/report", tags=["Report"])
