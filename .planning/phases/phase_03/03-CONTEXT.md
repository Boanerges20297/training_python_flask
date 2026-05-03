# Phase 3 Context: Data & Testability

## Decisions
1. **Volume**: **Realistic Scale**. ~200 clients, 5 barbers, and 1000+ historical appointments.
2. **Timeline**: **90 days** of historical data to show growth and occupancy trends.
3. **Tooling**: A Python script `backend/scripts/seed_data.py` using `Faker`.
4. **Consistency**:
   - **Realistic Pricing**:
     - Corte de Cabelo: R$ 50 - 80
     - Barba Completa: R$ 35 - 50
     - Sobrancelha: R$ 15 - 25
     - Combo (Corte + Barba): R$ 80 - 120
     - Limpeza de Pele: R$ 40 - 70
   - **Financial Logic**: Revenue in the dashboard must exactly match the sum of completed appointment prices.
   - **Occupancy Logic**: Appointments should be distributed mainly between 09h and 19h, with peaks on Fridays and Saturdays.

## Technical Strategy
- Create a standalone script that:
  - Clears existing data (optional/configurable).
  - Creates predefined professional Services.
  - Generates Barbers with realistic names.
  - Generates Clients with realistic phones/emails.
  - Generates a dense history of Appointments with varied statuses (Concluído, Cancelado, Pendente).

## Impact
- The Dashboard will show meaningful Recharts visualizations.
- Productivity metrics per barber will be visible.
- Financial decision-making features can be tested.
