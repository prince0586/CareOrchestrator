import os
from google.adk.agents import LlmAgent, SequentialAgent
from .tools import check_provider_calendar, verify_insurance_eligibility

# Step 1: Triage and Appointment
appointment_agent = LlmAgent(
    name="AppointmentAgent",
    model=os.getenv("GEN_FAST_MODEL", "gemini-2.5-flash"),
    instruction="You are the Appointment Agent. Gather patient details, symptoms, and the type of care required.",
    output_key="patient_details" # Saves output to shared state
)

# Step 2: Scheduling
scheduling_agent = LlmAgent(
    name="SchedulingAgent",
    model=os.getenv("GEN_FAST_MODEL", "gemini-2.5-flash"),
    instruction="You are the Scheduling Agent. Using the following patient info: {patient_details}, check provider calendars to find valid slots and prevent double-booking. Confirm the scheduled time.",
    tools=[check_provider_calendar], # Connects the custom calendar tool
    output_key="appointment_time" # Saves output to shared state
)

# Step 3: Insurance and Pre-Authorization
insurance_agent = LlmAgent(
    name="InsuranceAgent",
    model=os.getenv("GEN_ADVANCED_MODEL", "gemini-2.5-pro"),
    instruction="You are the Insurance Agent. Using {patient_details} and the scheduled {appointment_time}, verify patient eligibility with the payer, check for prior authorization requirements, and submit the pre-auth forms.",
    tools=[verify_insurance_eligibility] # Connects the custom insurance tool
)

# The Orchestrator: Our Digital Assembly Line
root_agent = SequentialAgent(
    name="HealthcareCareOrchestrator",
    sub_agents=[appointment_agent, scheduling_agent, insurance_agent],
    description="Orchestrates the end-to-end patient journey from appointment triage to insurance pre-authorization."
)
