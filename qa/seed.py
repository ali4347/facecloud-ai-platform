"""Test data for the QA stack. Run through: python manage.py shell < seed.py   (done by start-test-stack.sh)

Accounts (all use the password below; sign in with the EMAIL):
  admin@qa.test      administrator (also a Django superuser)
  owner@qa.test      owner of "QA Team"        mod@qa.test     moderator of "QA Team"     member@qa.test   member of "QA Team"
  owner2@qa.test     owner of "Other Team"     mod2@qa.test    moderator of "Other Team"  member2@qa.test  member of "Other Team"
  plain@qa.test      an ordinary user who belongs to no team
"""
from django.contrib.auth import get_user_model as g
from organizations.models import Organization, OrganizationMembership as M

PW = "Qa-Pass-Phrase-2026!"
U = g()


def user(name, role="user"):
    return U.objects.create_user(name, email=f"{name}@qa.test", password=PW, role=role, is_email_verified=True)


admin = U.objects.create_superuser("admin", email="admin@qa.test", password=PW)
people = {n: user(n, "moderator" if n.startswith("mod") else "user") for n in ("owner", "mod", "member", "owner2", "mod2", "member2", "plain")}
for slug, name, owner, mod, member in (("qa-team", "QA Team", "owner", "mod", "member"), ("other-team", "Other Team", "owner2", "mod2", "member2")):
    org = Organization.objects.create(name=name, slug=slug, plan="team", moderator_data_scope="organization")
    for who, role in ((owner, "owner"), (mod, "moderator"), (member, "member")):
        M.objects.create(organization=org, user=people[who], role=role, status="active")
print("seeded", U.objects.count(), "accounts,", Organization.objects.filter(is_personal=False).count(), "teams")
