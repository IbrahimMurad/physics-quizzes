from django import template

register = template.Library()

@register.filter
def get_score_color(score):
    if not score:
        return "score-gray"
    if score >= 90:
        return "score-green"
    elif score >= 80:
        return "score-blue"
    elif score >= 70:
        return "score-yellow"
    return "score-red"
