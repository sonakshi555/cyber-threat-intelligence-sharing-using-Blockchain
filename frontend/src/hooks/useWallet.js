/* ==========================================================================
   useWallet — lightweight EIP-1193 (MetaMask / Brave / Rabby) connector.
   No extra dependencies. Exposes the three UX states required by the design:
     'unavailable'   → no injected wallet in the browser
     'disconnected'  → wallet present but no account authorised
     'wrong-network' → connected but not on Ethereum Sepolia (11155111)
     'connected'     → connected on Sepolia
   ========================================================================== */
import { useCallback, useEffect, useState } from 'react';
import { SEPOLIA_CHAIN_ID } from '../threatData';

const SEPOLIA_HEX = `0x${SEPOLIA_CHAIN_ID.toString(16)}`; // 0xaa36a7

export function useWallet() {
  const eth = typeof window !== 'undefined' ? window.ethereum : undefined;
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  // Silently restore an already-authorised account (no popup).
  useEffect(() => {
    if (!eth) return undefined;
    eth.request({ method: 'eth_accounts' }).then((a) => setAccount(a?.[0] || null)).catch(() => {});
    eth.request({ method: 'eth_chainId' }).then(setChainId).catch(() => {});
    const onAccounts = (a) => setAccount(a?.[0] || null);
    const onChain = (id) => setChainId(id);
    eth.on?.('accountsChanged', onAccounts);
    eth.on?.('chainChanged', onChain);
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts);
      eth.removeListener?.('chainChanged', onChain);
    };
  }, [eth]);

  const connect = useCallback(async () => {
    if (!eth) {
      window.open('https://metamask.io/download/', '_blank', 'noopener');
      return;
    }
    setConnecting(true);
    setError('');
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      setAccount(accounts?.[0] || null);
      setChainId(await eth.request({ method: 'eth_chainId' }));
    } catch (e) {
      setError(e?.code === 4001 ? 'Connection request was rejected.' : 'Unable to connect wallet.');
    } finally {
      setConnecting(false);
    }
  }, [eth]);

  const switchToSepolia = useCallback(async () => {
    if (!eth) return;
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_HEX }] });
    } catch (e) {
      setError(e?.code === 4001 ? 'Network switch was rejected.' : 'Could not switch to Sepolia.');
    }
  }, [eth]);

  const disconnect = useCallback(() => setAccount(null), []);

  const status = !eth ? 'unavailable' : !account ? 'disconnected' : chainId?.toLowerCase() !== SEPOLIA_HEX ? 'wrong-network' : 'connected';

  return { status, account, chainId, connecting, error, connect, switchToSepolia, disconnect };
}
