from django.shortcuts import redirect

def reload(request):
    """ Reloads the current page
    """
    return redirect(request.META.get("HTTP_REFERER", "/"))

