/** On-chain milestone status byte (IDL Milestone.status). Values must match the program. */
export enum MilestoneStatus {
  Pending = 0,
  Released = 1,
  Disputed = 2,
  Refunded = 3,
}

export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  [MilestoneStatus.Pending]: "Pending",
  [MilestoneStatus.Released]: "Released",
  [MilestoneStatus.Disputed]: "Disputed",
  [MilestoneStatus.Refunded]: "Refunded",
};

export const isMilestoneStatus = (n: number): n is MilestoneStatus => n in MILESTONE_STATUS_LABEL;
