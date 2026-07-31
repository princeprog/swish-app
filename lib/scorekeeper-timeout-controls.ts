type TimeoutControlDialogInput = {
  remaining: number;
  teamName: string;
};

type TimeoutControlDialog = {
  blocked: boolean;
  confirmLabel: string;
  description: string;
  title: string;
};

export function getTimeoutControlDialog({
  remaining,
  teamName,
}: TimeoutControlDialogInput): TimeoutControlDialog {
  if (remaining <= 0) {
    return {
      blocked: true,
      confirmLabel: "Close",
      description: `${teamName} has no timeouts left for this part of the game.`,
      title: "No timeouts left",
    };
  }

  const nextRemaining = remaining - 1;

  return {
    blocked: false,
    confirmLabel: "Record timeout",
    description: `This will record a timeout for ${teamName}, pause the clocks, and leave ${nextRemaining} timeout${nextRemaining === 1 ? "" : "s"} for this part of the game.`,
    title: `Record timeout for ${teamName}?`,
  };
}
