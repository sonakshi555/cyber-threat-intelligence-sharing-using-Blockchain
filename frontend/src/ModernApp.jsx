import { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './components/ui/overlays';
import { AppNavbar } from './components/layout/AppNavbar';
import { AppSidebar } from './components/layout/AppSidebar';
import { AppFooter } from './components/layout/AppFooter';
import { AuthModal } from './components/auth/AuthModal';
import { DocumentationModal } from './components/pages/DocumentationModal';
import { LandingPage } from './components/pages/LandingPage';
import { DashboardOverview } from './components/pages/DashboardOverview';
import { ThreatFeedPage } from './components/pages/ThreatFeedPage';
import { SubmitThreatPage } from './components/pages/SubmitThreatPage';
import { ConsensusValidationPage } from './components/pages/ConsensusValidationPage';
import { BlockExplorerPage, OnChainProofModal } from './components/pages/BlockExplorerPage';
import { AiInsightsPage } from './components/pages/AiInsightsPage';
import { useThreatStore } from './hooks/useThreatStore';
import { useWallet } from './hooks/useWallet';
import { getStoredSession, logoutUser, completeGoogleRedirect } from './authStore';

function AppContent() {
  const [currentUser, setCurrentUser] = useState(() => getStoredSession());
  const [activePage, setActivePage] = useState('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [selectedProofThreat, setSelectedProofThreat] = useState(null);
  const [selectedShapThreat, setSelectedShapThreat] = useState(null);

  const { toast } = useToast();
  const wallet = useWallet();
  const {
    threats,
    feed,
    pending,
    tokenBalance,
    stageSubmission,
    approve,
    reject,
    refresh,
  } = useThreatStore(currentUser);

  // Restore stored session and complete redirect if returning from Google
  useEffect(() => {
    completeGoogleRedirect().then((result) => {
      if (result && !result.error) {
        setCurrentUser(result);
        toast({
          tone: 'success',
          title: 'Welcome Back',
          description: `Signed in as ${result.name || result.email}`,
        });
      }
    });
  }, [toast]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    toast({
      tone: 'success',
      title: 'Authentication Successful',
      description: `Logged in as ${user.name || user.email} (${user.badge || user.role})`,
    });
    if (activePage === 'landing') {
      setActivePage('dashboard');
    }
  };

  const handleSignOut = () => {
    logoutUser();
    setCurrentUser(null);
    toast({
      tone: 'info',
      title: 'Signed Out',
      description: 'You have been signed out of your session.',
    });
  };

  const stats = {
    threatsCount: threats.length,
    latestBlock: threats[0]?.receipt?.block_number || 6849240,
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      {/* Top Navigation Bar */}
      <AppNavbar
        currentUser={currentUser}
        tokenBalance={tokenBalance}
        wallet={wallet}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <div className="relative flex flex-1 w-full min-h-[calc(100vh-4rem)]">
        {/* Responsive Hover-Expandable Sidebar */}
        <AppSidebar
          activePage={activePage}
          onNavigate={setActivePage}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          pendingCount={pending.length}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Workspace */}
        <main className="flex-1 min-w-0 px-4 py-8 md:px-8 lg:px-10 bg-grid pb-28">
          <div className="mx-auto max-w-7xl">
            {activePage === 'landing' && (
              <LandingPage
                onLaunchApp={() => setActivePage('dashboard')}
                onOpenDocs={() => setDocsModalOpen(true)}
                stats={stats}
                onNavigate={setActivePage}
              />
            )}

            {activePage === 'dashboard' && (
              <DashboardOverview
                threats={threats}
                pendingCount={pending.length}
                tokenBalance={tokenBalance}
                onNavigate={setActivePage}
                onInspectProof={(item) => setSelectedProofThreat(item)}
                role={currentUser?.role}
              />
            )}

            {activePage === 'feed' && (
              <ThreatFeedPage
                feed={feed}
                onInspectProof={(item) => setSelectedProofThreat(item)}
                onInspectShap={(item) => {
                  setSelectedShapThreat(item);
                  setActivePage('insights');
                }}
              />
            )}

            {activePage === 'submit' && (
              <SubmitThreatPage
                currentUser={currentUser}
                onStagedSubmission={(res, meta) => {
                  stageSubmission(res, meta);
                  toast({
                    tone: 'success',
                    title: 'Evidence Staged',
                    description: 'Report submitted to validator consensus queue.',
                  });
                }}
                onNavigateToConsensus={() => setActivePage('consensus')}
                onNavigateToFeed={() => setActivePage('feed')}
              />
            )}

            {activePage === 'consensus' && (
              <ConsensusValidationPage
                pending={pending}
                onApprove={async (rep, opts) => {
                  const res = await approve(rep, opts);
                  toast({
                    tone: 'success',
                    title: 'Consensus Quorum Reached',
                    description: `Block mined on Sepolia. +25 CTIX rewarded.`,
                  });
                  return res;
                }}
                onReject={async (rep) => {
                  await reject(rep);
                  toast({
                    tone: 'info',
                    title: 'Report Rejected',
                    description: 'Report archived off-chain.',
                  });
                }}
                role={currentUser?.role}
                onInspectProof={(item) => setSelectedProofThreat(item)}
                onNavigateToExplorer={() => setActivePage('explorer')}
              />
            )}

            {activePage === 'explorer' && (
              <BlockExplorerPage
                threats={threats}
                onInspectProof={(item) => setSelectedProofThreat(item)}
              />
            )}

            {activePage === 'insights' && (
              <AiInsightsPage
                threats={threats}
                selectedThreat={selectedShapThreat}
              />
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <AppFooter onOpenDocs={() => setDocsModalOpen(true)} />

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Docs Modal */}
      <DocumentationModal
        open={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
      />

      {/* On-Chain Cryptographic Proof Modal */}
      {selectedProofThreat && (
        <OnChainProofModal
          threat={selectedProofThreat}
          onClose={() => setSelectedProofThreat(null)}
        />
      )}
    </div>
  );
}

export default function ModernApp() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
