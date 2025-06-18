from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProfileListView.as_view(), name='profile-list'),
    path('<int:pk>/', views.ProfileDetailView.as_view(), name='profile-detail'),
    path('me/', views.my_profile, name='my-profile'),
    path('me/update/', views.update_my_profile, name='update-my-profile'),
    path('top-freelancers/', views.top_freelancers, name='top-freelancers'),
    path('newcomers/', views.newcomer_freelancers, name='newcomer-freelancers'),
    path('featured/', views.featured_freelancers, name='featured-freelancers'),
    path('demos/', views.VideoDemoListCreateView.as_view(), name='video-demo-list-create'),
    path('demos/<int:pk>/', views.VideoDemoDetailView.as_view(), name='video-demo-detail'),
] 