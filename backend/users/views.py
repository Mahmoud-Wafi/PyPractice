from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer
from .models import User


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'put']

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        # Only allow updating name and skill_level
        allowed = {k: v for k, v in request.data.items() if k in ['name', 'skill_level']}
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=allowed, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
            return Response({'detail': 'Logged out successfully.'})
        except Exception:
            return Response({'detail': 'Invalid or expired token.'}, status=400)


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum, Count
        from curriculum.models import UserProgress
        from django.contrib.auth import get_user_model
        User = get_user_model()

        results = (
            UserProgress.objects
            .values('user__id', 'user__name', 'user__skill_level')
            .annotate(
                total_score=Sum('total_score'),
                total_solved=Sum('questions_completed'),
            )
            .order_by('-total_score')[:20]
        )

        data = []
        for i, r in enumerate(results, start=1):
            data.append({
                'rank': i,
                'name': r['user__name'],
                'skill_level': r['user__skill_level'],
                'total_score': r['total_score'] or 0,
                'total_solved': r['total_solved'] or 0,
                'is_me': str(r['user__id']) == str(request.user.id),
            })
        return Response(data)
