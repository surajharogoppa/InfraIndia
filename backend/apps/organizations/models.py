from django.db import models


class Ministry(models.Model):
    name = models.CharField(max_length=255, unique=True)
    short_name = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "ministries"

    def __str__(self):
        return self.short_name or self.name


class Department(models.Model):
    name = models.CharField(max_length=255)
    ministry = models.ForeignKey(
        Ministry, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="departments"
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Organization(models.Model):
    name = models.CharField(max_length=255, unique=True)
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="organizations"
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Sector(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
