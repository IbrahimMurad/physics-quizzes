import json
import os

from django.core.management.base import BaseCommand
from django.db import transaction

from problem.models import Choice, Problem
from scope.models import Scope


class Command(BaseCommand):
    help = "Import science questions from a JSON file into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "json_file", type=str, help="Path to the JSON file to import"
        )

    def handle(self, *args, **options):
        json_file = options["json_file"]

        if not os.path.exists(json_file):
            self.stderr.write(self.style.ERROR(f"File {json_file} does not exist"))
            return

        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            self.stderr.write(self.style.ERROR(f"Error parsing JSON file: {e}"))
            return

        if not isinstance(data, list):
            self.stderr.write(
                self.style.ERROR("JSON file should contain an array of topics")
            )
            return

        with transaction.atomic():
            for topic_data in data:
                if not all(key in topic_data for key in ["title", "problems"]):
                    self.stderr.write(
                        self.style.WARNING(
                            f"Skipping invalid topic: {topic_data.get('title', 'Untitled')}"
                        )
                    )
                    continue

                # Create topic scope
                topic_title = topic_data["title"]
                self.stdout.write(
                    self.style.SUCCESS(f"Processing topic: {topic_title}")
                )

                try:
                    topic_scope = Scope.objects.get(
                        title=topic_title,
                        level=Scope.LevelChoices.LESSON,
                    )

                    # Process problems
                    for problem_data in topic_data.get("problems", []):
                        if "body" not in problem_data or "choices" not in problem_data:
                            self.stderr.write(
                                self.style.WARNING("Skipping invalid problem")
                            )
                            continue

                        # Create problem
                        if Problem.objects.filter(body=problem_data["body"]).exists():
                            self.stderr.write(
                                self.style.WARNING("Skipping duplicate problem")
                            )
                            continue
                        problem = Problem.objects.create(
                            scope=topic_scope,
                            body=problem_data["body"],
                            is_published=True,
                        )

                        # Create choices
                        for choice_data in problem_data.get("choices", []):
                            Choice.objects.create(
                                problem=problem,
                                body=choice_data.get("body", ""),
                                is_correct=choice_data.get("is_correct", False),
                            )

                        self.stdout.write(
                            self.style.SUCCESS(
                                f"  - Added problem: {problem.body[:50]}..."
                            )
                        )
                except Scope.DoesNotExist:
                    self.stderr.write(
                        self.style.ERROR(f"Topic {topic_title} not found. Skipping...")
                    )
                    continue

        self.stdout.write(self.style.SUCCESS("Successfully imported all data"))
