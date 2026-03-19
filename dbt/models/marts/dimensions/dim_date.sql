with date_spine as (
    {{ dbt_utils.date_spine(
        datepart='day',
        start_date="cast('1990-01-01' as date)",
        end_date="cast('2051-01-01' as date)"
    ) }}
)

select
    cast(date_day as date) as date_day,
    extract(year from date_day) as date_year,
    extract(month from date_day) as date_month,
    extract(quarter from date_day) as date_quarter,
    cast(
        date_day = date_sub(
            date_add(date_trunc(date_day, quarter), interval 3 month),
            interval 1 day
        )
        as bool
    ) as is_quarter_end,
    concat(
        cast(extract(year from date_day) as string),
        '-Q',
        cast(extract(quarter from date_day) as string)
    ) as year_quarter,
    case
        when extract(month from date_day) between 7 and 9 then 1
        when extract(month from date_day) between 10 and 12 then 2
        when extract(month from date_day) between 1 and 3 then 3
        else 4
    end as financial_quarter,
    case
        when extract(month from date_day) >= 7 then extract(year from date_day) + 1
        else extract(year from date_day)
    end as financial_year
from date_spine