from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProjectListCreateView.as_view(), name='project-list-create'),
    path('<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('<int:project_id>/proposals/', views.ProjectProposalListCreateView.as_view(), name='project-proposals'),
    path('proposals/', views.ProposalListCreateView.as_view(), name='proposal-list-create'),
    path('my-projects/', views.my_projects, name='my-projects'),
    path('my-proposals/', views.my_proposals, name='my-proposals'),
    path('my-active-projects/', views.my_active_projects, name='my-active-projects'),
] 