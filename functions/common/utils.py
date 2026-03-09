from datetime import datetime, timezone

def get_current_imf_time_period_str() -> str:
    """
    Returns the earliest time period (in quarters) to query for data.
    The IMF datasets align with the calendar year, with Q1 being Jan-Mar.
    We query for the last 2 quarters of data to ensure that we don't miss anything,
    (there doesn't seem to be a fixed upload schedule for dataset uploads)
    and duplicates are later filtered out during staging.    
    """
    
    now = datetime.now(tz=timezone.utc)
    curr_year = now.year
    curr_month = now.month

    curr_quarter = (curr_month - 1) // 3 + 1

    # Subtract 2 quarters from current quarter
    if curr_quarter <= 2:
        target_quarter = curr_quarter + 2
        target_year = curr_year - 1
    else:
        target_quarter = curr_quarter - 2
        target_year = curr_year

    return f"{target_year}-Q{target_quarter}"
