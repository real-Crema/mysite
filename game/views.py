from django.shortcuts import render


def game_view(request):
    return render(request, 'game/popit.html')
