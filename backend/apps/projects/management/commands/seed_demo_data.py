"""
Management command to seed the database with realistic demo data
for development and UI testing.

Usage:
    python manage.py seed_demo_data
    python manage.py seed_demo_data --clear
"""
import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction


SECTORS = ["Roads", "Railways", "Power", "Water Supply", "Urban Development",
           "Healthcare", "Education", "Irrigation", "Ports", "Telecom"]

MINISTRIES = [
    ("Ministry of Road Transport and Highways", "MoRTH"),
    ("Ministry of Railways", "MoR"),
    ("Ministry of Power", "MoP"),
    ("Ministry of Jal Shakti", "MoJS"),
    ("Ministry of Housing and Urban Affairs", "MoHUA"),
    ("Ministry of Health and Family Welfare", "MoHFW"),
    ("Ministry of Education", "MoE"),
    ("Ministry of Ports, Shipping and Waterways", "MoPSW"),
]

STATES = [
    ("Andhra Pradesh", "AP"), ("Assam", "AS"), ("Bihar", "BR"),
    ("Chhattisgarh", "CG"), ("Gujarat", "GJ"), ("Haryana", "HR"),
    ("Himachal Pradesh", "HP"), ("Jharkhand", "JH"), ("Karnataka", "KA"),
    ("Kerala", "KL"), ("Madhya Pradesh", "MP"), ("Maharashtra", "MH"),
    ("Manipur", "MN"), ("Meghalaya", "ML"), ("Odisha", "OD"),
    ("Punjab", "PB"), ("Rajasthan", "RJ"), ("Tamil Nadu", "TN"),
    ("Telangana", "TS"), ("Uttar Pradesh", "UP"), ("Uttarakhand", "UK"),
    ("West Bengal", "WB"), ("Delhi", "DL"), ("Goa", "GA"),
]

PROJECT_NAME_PARTS = {
    "Roads": [
        "National Highway Development", "Ring Road Construction",
        "Expressway Project", "Bypass Road Construction",
        "Bridge Development", "Flyover Construction",
        "Tunnel Project", "Hill Road Improvement"
    ],
    "Railways": [
        "Metro Rail Project", "High Speed Rail Corridor",
        "Station Redevelopment", "Rail Electrification",
        "New Railway Line", "Gauge Conversion",
        "Railway Bridge Construction", "Suburban Rail Expansion"
    ],
    "Power": [
        "Solar Power Plant", "Hydro Power Project",
        "Thermal Power Station Expansion", "Power Transmission Line",
        "Smart Grid Project", "Wind Energy Farm",
        "Rural Electrification", "Power Distribution Network"
    ],
    "Water Supply": [
        "Drinking Water Supply Scheme", "Water Treatment Plant",
        "Pipeline Network Expansion", "Reservoir Construction",
        "Canal Modernization", "Groundwater Development"
    ],
    "Urban Development": [
        "Smart City Infrastructure", "Urban Transport Improvement",
        "Sewage Treatment Plant", "Storm Water Drain",
        "Urban Housing Project", "Industrial Area Development"
    ],
    "Healthcare": [
        "AIIMS Hospital Construction", "District Hospital Upgrade",
        "Medical College Infrastructure", "Health Center Development"
    ],
    "Education": [
        "IIT Campus Development", "NIT Infrastructure Project",
        "Central University Campus", "School Construction Program"
    ],
    "Irrigation": [
        "Irrigation Canal Development", "Dam Construction",
        "Lift Irrigation Scheme", "River Interlinking"
    ],
    "Ports": [
        "Port Modernization", "Container Terminal Development",
        "Coastal Connectivity Project"
    ],
    "Telecom": [
        "BharatNet Fiber Network", "5G Tower Rollout",
        "Rural Connectivity Project"
    ],
}

SOURCE_STATUSES = ["Under Implementation", "Completed", "Awarded", "Tendering", "DPR Stage"]
PLATFORM_STATUSES = ["ACTIVE", "ACTIVE", "ACTIVE", "COMPLETED", "PLANNED"]

class Command(BaseCommand):
    help = "Seed the database with realistic demo government project data"

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Clear existing data before seeding")
        parser.add_argument("--count", type=int, default=200, help="Number of projects to create")

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing data...")
            self._clear_data()

        self.stdout.write(f"Seeding {options['count']} demo projects...")

        with transaction.atomic():
            source = self._get_or_create_source()
            states = self._create_states()
            ministries = self._create_ministries()
            sectors = self._create_sectors()
            self._create_projects(options["count"], source, states, ministries, sectors)

        self.stdout.write(self.style.SUCCESS(f"SUCCESS: Seeded {options['count']} projects successfully."))

    def _clear_data(self):
        # pyrefly: ignore [missing-import]
        from apps.projects.models import Project, ProjectSnapshot, ProjectChange
        # pyrefly: ignore [missing-import]
        from apps.organizations.models import Ministry, Department, Organization, Sector
        # pyrefly: ignore [missing-import]
        from apps.locations.models import State, District
        # pyrefly: ignore [missing-import]
        from apps.sources.models import DataSource
        ProjectChange.objects.all().delete()
        ProjectSnapshot.objects.all().delete()
        Project.objects.all().delete()
        Organization.objects.all().delete()
        Department.objects.all().delete()
        Ministry.objects.all().delete()
        Sector.objects.all().delete()
        District.objects.all().delete()
        State.objects.all().delete()
        DataSource.objects.all().delete()

    def _get_or_create_source(self):
        # pyrefly: ignore [missing-import]
        from apps.sources.models import DataSource
        source, _ = DataSource.objects.get_or_create(
            name="Demo Data Source",
            defaults={
                "organization": "Platform Demo",
                "source_type": DataSource.SourceType.CSV,
                "access_method": DataSource.AccessMethod.MANUAL_UPLOAD,
                "update_frequency": "Monthly",
                "notes": "Realistic demo data for development and UI testing.",
                "is_active": True,
            }
        )
        return source

    def _create_states(self):
        # pyrefly: ignore [missing-import]
        from apps.locations.models import State, District
        states = []
        districts_map = {
            "Karnataka": ["Bengaluru Urban", "Mysuru", "Hubli-Dharwad", "Belagavi", "Mangaluru"],
            "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
            "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
            "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj"],
            "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
            "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Ajmer", "Kota"],
            "West Bengal": ["Kolkata", "Howrah", "Asansol", "Siliguri", "Durgapur"],
            "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
            "Delhi": ["New Delhi", "Central Delhi", "North Delhi", "South Delhi"],
            "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
        }
        for state_name, code in STATES:
            state, _ = State.objects.get_or_create(name=state_name, defaults={"code": code})
            states.append(state)
            for dist_name in districts_map.get(state_name, [f"{state_name} Central"]):
                District.objects.get_or_create(name=dist_name, state=state)
        return states

    def _create_ministries(self):
        # pyrefly: ignore [missing-import]
        from apps.organizations.models import Ministry, Department, Organization
        ministries = []
        for name, short in MINISTRIES:
            ministry, _ = Ministry.objects.get_or_create(name=name, defaults={"short_name": short})
            Department.objects.get_or_create(name=f"{short} - Infrastructure Division", defaults={"ministry": ministry})
            Organization.objects.get_or_create(name=f"{short} Project Authority", defaults={})
            ministries.append(ministry)
        return ministries

    def _create_sectors(self):
        # pyrefly: ignore [missing-import]
        from apps.organizations.models import Sector
        return [Sector.objects.get_or_create(name=s)[0] for s in SECTORS]

    def _create_projects(self, count, source, states, ministries, sectors):
        # pyrefly: ignore [missing-import]
        from apps.projects.models import Project, ProjectSnapshot, ProjectChange
        # pyrefly: ignore [missing-import]
        from apps.locations.models import District

        today = date.today()

        for i in range(count):
            sector = random.choice(sectors)
            state = random.choice(states)
            ministry = random.choice(ministries)
            district = District.objects.filter(state=state).order_by("?").first()

            # Generate realistic project name
            name_pool = PROJECT_NAME_PARTS.get(sector.name, [f"{sector.name} Development Project"])
            project_name = f"{random.choice(name_pool)} - {state.name} Phase {random.randint(1, 3)}"

            # Financial values (in Crore, stored as paise)
            original_cost_cr = random.choice([
                random.uniform(5, 50), random.uniform(50, 200),
                random.uniform(200, 800), random.uniform(800, 3000)
            ])
            cost_change_pct = random.uniform(-5, 40)
            current_cost_cr = original_cost_cr * (1 + cost_change_pct / 100)
            progress = random.uniform(0, 100)
            expenditure_cr = current_cost_cr * (progress / 100) * random.uniform(0.6, 1.1)
            expenditure_cr = min(expenditure_cr, current_cost_cr)

            CRORE = 10_000_000
            original_cost = int(original_cost_cr * CRORE)
            current_cost = int(current_cost_cr * CRORE)
            expenditure = int(expenditure_cr * CRORE)

            # Dates
            years_ago = random.randint(1, 6)
            orig_start = today - timedelta(days=years_ago * 365)
            duration = timedelta(days=random.randint(365, 5 * 365))
            orig_completion = orig_start + duration
            delay_months = random.choice([0, 0, 0, 3, 6, 12, 18, 24])
            curr_completion = orig_completion + timedelta(days=delay_months * 30)

            src_status = random.choice(SOURCE_STATUSES)
            plat_status = "COMPLETED" if progress >= 95 else "ACTIVE" if progress > 0 else "PLANNED"

            # Create project
            project = Project.objects.create(
                external_project_id=f"DEMO-{i+1:05d}",
                name=project_name,
                ministry=ministry,
                sector=sector,
                state=state,
                district=district,
                original_cost=original_cost,
                current_cost=current_cost,
                current_expenditure=expenditure,
                current_progress=round(progress, 1),
                original_start_date=orig_start,
                current_start_date=orig_start,
                original_completion_date=orig_completion,
                current_completion_date=curr_completion,
                source_status=src_status,
                platform_status=plat_status,
                contractor_name=random.choice([
                    "L&T Infrastructure Ltd", "Tata Projects Ltd",
                    "NCC Limited", "RVNL", "NHAI", "IRCON International",
                    "Shapoorji Pallonji", "HCC Limited", "GMR Infrastructure",
                    "Afcons Infrastructure"
                ]),
                source=source,
            )

            # Create initial snapshot
            snap1 = ProjectSnapshot.objects.create(
                project=project,
                snapshot_date=orig_start + timedelta(days=30),
                project_cost=original_cost,
                revised_cost=original_cost,
                expenditure=0,
                physical_progress=0,
                start_date=orig_start,
                completion_date=orig_completion,
                source_status="Awarded",
                source=source,
            )

            # Create a second snapshot if delayed
            if delay_months > 0 or progress > 20:
                mid_progress = progress * random.uniform(0.3, 0.7)
                mid_exp = int(current_cost * (mid_progress / 100) * 0.8)
                snap2 = ProjectSnapshot.objects.create(
                    project=project,
                    snapshot_date=today - timedelta(days=random.randint(60, 180)),
                    project_cost=original_cost,
                    revised_cost=current_cost if cost_change_pct > 5 else original_cost,
                    expenditure=mid_exp,
                    physical_progress=round(mid_progress, 1),
                    completion_date=curr_completion,
                    source_status="Under Implementation",
                    source=source,
                )

                # Cost change event
                if cost_change_pct > 5:
                    ProjectChange.objects.create(
                        project=project,
                        snapshot=snap2,
                        change_type=ProjectChange.ChangeType.COST_CHANGED,
                        field_name="cost",
                        old_value=str(original_cost),
                        new_value=str(current_cost),
                        change_amount=float(current_cost - original_cost),
                        change_percentage=round(cost_change_pct, 2),
                    )

                # Completion date change event
                if delay_months > 0:
                    ProjectChange.objects.create(
                        project=project,
                        snapshot=snap2,
                        change_type=ProjectChange.ChangeType.COMPLETION_DATE_CHANGED,
                        field_name="completion_date",
                        old_value=str(orig_completion),
                        new_value=str(curr_completion),
                        change_amount=float(delay_months * 30),
                    )

            if (i + 1) % 50 == 0:
                self.stdout.write(f"  Created {i + 1} projects...")
