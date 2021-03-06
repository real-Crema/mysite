from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.urls import reverse


class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(status='published')
    

class Post(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
    )
    title = models.CharField(max_length=250)
    slug = models.SlugField(max_length=250,
                            unique_for_date='publish')
    author = models.ForeignKey(User,
                               on_delete=models.CASCADE,
                               related_name='blog_posts')
    body = models.TextField()
    publish = models.DateTimeField(default=timezone.now)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=10,
                              choices=STATUS_CHOICES,
                              default='draft')
    objects = models.Manager()  # The default manager.
    published = PublishedManager()  # The custom manager.
    
    class Meta:
        ordering = ('-publish',)
    
    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse(viewname='blog:post_detail',
                       args=[self.publish.year,
                             self.publish.month,
                             self.publish.day,
                             self.slug])
    
    def get_publish_date(self):
        today = timezone.datetime.today()
        publish_date = str(self.publish.month) + ' 月 ' + str(self.publish.day) + ' 日 '
        if today.year == self.publish.year:
            return publish_date
        else:
            return str(self.publish.year) + ' 年 ' + publish_date
