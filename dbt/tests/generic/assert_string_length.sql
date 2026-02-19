{% test assert_string_length(model, column_name, expected_length) %}
    select *
    from {{ model }}
    where length({{ column_name }}) != {{ expected_length }}
{% endtest %}