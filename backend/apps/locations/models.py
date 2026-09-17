from django.db import models


class State(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)  # e.g. KA, MH, TN

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class District(models.Model):
    name = models.CharField(max_length=100)
    state = models.ForeignKey(State, on_delete=models.PROTECT, related_name="districts")

    class Meta:
        ordering = ["name"]
        unique_together = [["name", "state"]]

    def __str__(self):
        return f"{self.name}, {self.state.name}"
