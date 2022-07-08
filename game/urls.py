from django.urls import path
from . import views

app_name = 'game'
urlpatterns = [
    path(route='',
         view=views.game_view,
         name='game_popit'),
]
