{% macro parse_imf_date(column_name) %}
    -- Converts a time period string from YYYY-Q# format
    -- to a date value corresponding to the final day of the month
    -- for the given quarter.
    last_day(
        date(
            cast(left({{ column_name }}, 4) as int64),
            cast(right({{ column_name }}, 1) as int64) * 3,
            1
        )
    )
{% endmacro %}