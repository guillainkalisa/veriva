from rest_framework import status
from rest_framework.response import Response


def resolve_gate(user, requested_gate):
    """Which gate a scan counts for, as (gate, error_response). A guard is
    confined to their assigned gates; admin and the security chief may use any."""
    if user.sees_all_gates:
        if requested_gate is None:
            return None, Response({'detail': 'Gate is required.'}, status=status.HTTP_400_BAD_REQUEST)
        return requested_gate, None

    allowed = user.gate_ids()
    if not allowed:
        return None, Response({'detail': 'You are not assigned to any gate.'}, status=status.HTTP_403_FORBIDDEN)
    if requested_gate is not None:
        if requested_gate.id not in allowed:
            return None, Response({'detail': 'You are not assigned to that gate.'}, status=status.HTTP_403_FORBIDDEN)
        return requested_gate, None
    if len(allowed) == 1:
        return user.assigned_gates.first(), None
    return None, Response({'detail': 'Specify which of your assigned gates.'}, status=status.HTTP_400_BAD_REQUEST)
