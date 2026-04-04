import os
from google.adk.agents import LlmAgent, SequentialAgent
from tools import (
    check_provider_calendar, 
    verify_insurance_eligibility, 
    search_medical_knowledge, 
    query_knowledge_base
)

# Step 1: Knowledge and Education (Wikipedia + Internal KB)
knowledge_agent = LlmAgent(
    name="KnowledgeAgent",
    model=os.getenv("GEN_FAST_MODEL", "gemini-2.5-flash"),
    instruction="""You are the Knowledge Agent. Your goal is to educate the patient about their symptoms or the care they are seeking.
    Use Wikipedia to provide summaries of medical conditions and the internal knowledge base for policy information.
    If the user asks about a condition, search for it. If they ask about policies, query the knowledge base.""",
    tools=[search_medical_knowledge, query_knowledge_base],
    output_key="medical_context"
)

# Step 2: Triage and Appointment
appointment_agent = LlmAgent(
    name="AppointmentAgent",
    model=os.getenv("GEN_FAST_MODEL", "gemini-2.5-flash"),
    instruction="You are the Appointment Agent. Using the {medical_context} if relevant, gather patient details, symptoms, and the type of care required.",
    output_key="patient_details" # Saves output to shared state
)

# Step 3: Scheduling
scheduling_agent = LlmAgent(
    name="SchedulingAgent",
    model=os.getenv("GEN_FAST_MODEL", "gemini-2.5-flash"),
    instruction="You are the Scheduling Agent. Using the following patient info: {patient_details}, check provider calendars to find valid slots and prevent double-booking. Confirm the scheduled time.",
    tools=[check_provider_calendar], # Connects the custom calendar tool
    output_key="appointment_time" # Saves output to shared state
)

# Step 4: Insurance and Pre-Authorization
insurance_agent = LlmAgent(
    name="InsuranceAgent",
    model=os.getenv("GEN_ADVANCED_MODEL", "gemini-2.5-pro"),
    instruction="You are the Insurance Agent. Using {patient_details} and the scheduled {appointment_time}, verify patient eligibility with the payer. Use the knowledge base to check for prior authorization requirements if needed.",
    tools=[verify_insurance_eligibility, query_knowledge_base] # Connects the custom insurance tool
)

# The Orchestrator: Our Digital Assembly Line
root_agent = SequentialAgent(
    name="HealthcareCareOrchestrator",
    sub_agents=[knowledge_agent, appointment_agent, scheduling_agent, insurance_agent],
    description="Orchestrates the end-to-end patient journey from medical knowledge retrieval to insurance pre-authorization."
)
