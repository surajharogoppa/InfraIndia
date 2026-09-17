"""
Change Detection Engine

Compares the latest ingested snapshot against the previous snapshot
and generates ProjectChange records for any detected differences.
"""

import logging
from datetime import date
from apps.projects.models import Project, ProjectSnapshot, ProjectChange

logger = logging.getLogger(__name__)

# Fields to monitor for changes
TRACKED_FIELDS = [
    ("current_cost", "revised_cost", ProjectChange.ChangeType.COST_CHANGED, "cost"),
    ("current_progress", "physical_progress", ProjectChange.ChangeType.PROGRESS_CHANGED, "progress"),
    ("current_expenditure", "expenditure", ProjectChange.ChangeType.EXPENDITURE_CHANGED, "expenditure"),
    ("current_completion_date", "completion_date", ProjectChange.ChangeType.COMPLETION_DATE_CHANGED, "completion_date"),
    ("current_start_date", "start_date", ProjectChange.ChangeType.START_DATE_CHANGED, "start_date"),
    ("source_status", "source_status", ProjectChange.ChangeType.STATUS_CHANGED, "source_status"),
]


def detect_changes(project: Project, new_snapshot: ProjectSnapshot):
    """
    Load the previous snapshot for this project and compare tracked fields.
    Creates ProjectChange records for any detected differences.

    Args:
        project: The Project instance being updated.
        new_snapshot: The newly created ProjectSnapshot.

    Returns:
        List of created ProjectChange instances.
    """
    # Get the previous snapshot (exclude the new one)
    previous = (
        ProjectSnapshot.objects
        .filter(project=project)
        .exclude(id=new_snapshot.id)
        .order_by("-snapshot_date", "-created_at")
        .first()
    )

    if previous is None:
        logger.info(f"No previous snapshot for project {project.id} — skipping change detection.")
        return []

    changes = []

    for project_field, snapshot_field, change_type, field_label in TRACKED_FIELDS:
        old_val = getattr(previous, snapshot_field, None)
        new_val = getattr(new_snapshot, snapshot_field, None)

        if old_val is None and new_val is None:
            continue
        if str(old_val) == str(new_val):
            continue

        change = ProjectChange(
            project=project,
            snapshot=new_snapshot,
            change_type=change_type,
            field_name=field_label,
            old_value=str(old_val) if old_val is not None else "",
            new_value=str(new_val) if new_val is not None else "",
        )

        # Calculate numeric delta where possible
        try:
            if isinstance(old_val, (int, float)) and isinstance(new_val, (int, float)):
                change.change_amount = float(new_val) - float(old_val)
                if old_val != 0:
                    change.change_percentage = round(
                        (float(new_val) - float(old_val)) / abs(float(old_val)) * 100, 2
                    )
            elif hasattr(old_val, 'year') and hasattr(new_val, 'year'):
                # Date delta in days
                delta = (new_val - old_val).days if new_val and old_val else None
                change.change_amount = delta
        except (TypeError, ZeroDivisionError):
            pass

        changes.append(change)
        logger.info(
            f"Change detected for project {project.id}: "
            f"{change_type} {field_label}: {old_val!r} → {new_val!r}"
        )

    if changes:
        ProjectChange.objects.bulk_create(changes)

    return changes
