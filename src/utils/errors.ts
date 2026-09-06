export interface FormattedError {
  title: string;
  message: string;
  action?: {
    label: string;
    url: string;
  };
}

export function formatCkbError(error: unknown): FormattedError {
  if (!error) {
    return {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred.',
    };
  }

  const rawMsg = error instanceof Error ? error.message : String(error);
  const lower = rawMsg.toLowerCase();

  if (lower.includes('reject') || lower.includes('cancel') || lower.includes('declined') || lower.includes('user closed')) {
    return {
      title: 'Transaction Cancelled',
      message: 'The signature request was cancelled or declined in your wallet.',
    };
  }

  if (lower.includes('capacity') || lower.includes('balance') || lower.includes('insufficient') || lower.includes('faucet')) {
    return {
      title: 'Insufficient CKB Balance',
      message: 'Your wallet does not have enough CKB capacity to cover cell creation and transaction fees.',
      action: {
        label: 'Get Testnet CKB (Faucet) →',
        url: 'https://faucet.nervos.org',
      },
    };
  }

  if (lower.includes('did') && (lower.includes('not exist') || lower.includes('inactive') || lower.includes('not found'))) {
    return {
      title: 'DID Resolution Failed',
      message: 'The specified did:ckb identifier could not be found or has been deactivated on CKB.',
      action: {
        label: 'Manage DIDs on Vellum →',
        url: 'https://vellum-lyart.vercel.app',
      },
    };
  }

  if (lower.includes('network') || lower.includes('timeout') || lower.includes('fetch') || lower.includes('connection')) {
    return {
      title: 'CKB Node Connection Error',
      message: 'Failed to communicate with CKB node RPC. Please check your network connection or try switching node endpoints.',
    };
  }

  return {
    title: 'Operation Failed',
    message: rawMsg,
  };
}

