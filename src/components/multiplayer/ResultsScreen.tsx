'use client';

import { PlayerInfo } from '@/lib/socketEvents';
import styles from '@/styles/ResultsScreen.module.css';

interface ResultsScreenProps {
  players: PlayerInfo[];
  winnerId: string | null;
  mySocketId: string | null;
  opponentDisconnected: boolean;
  onPlayAgain: () => void;
  onBack: () => void;
}

export default function ResultsScreen({
  players,
  winnerId,
  mySocketId,
  opponentDisconnected,
  onPlayAgain,
  onBack,
}: ResultsScreenProps) {
  const iWon = winnerId === mySocketId;
  const isTie = winnerId === null && !opponentDisconnected;

  let titleText: string;
  let titleClass: string;

  if (opponentDisconnected) {
    titleText = 'Opponent Left';
    titleClass = styles.win;
  } else if (isTie) {
    titleText = "It's a Tie!";
    titleClass = styles.tie;
  } else if (iWon) {
    titleText = 'You Win!';
    titleClass = styles.win;
  } else {
    titleText = 'You Lose';
    titleClass = styles.lose;
  }

  const me = players.find(p => p.socketId === mySocketId);
  const opponent = players.find(p => p.socketId !== mySocketId);

  return (
    <div className={styles.results}>
      <div className={`${styles.title} ${titleClass}`}>{titleText}</div>
      <div className={styles.subtitle}>
        {opponentDisconnected ? 'You win by default' : 'Final Scores'}
      </div>

      <div className={styles.scoreBoard}>
        <div className={`${styles.playerCard} ${(iWon || opponentDisconnected) ? styles.playerCardWinner : ''}`}>
          <div className={styles.playerCardName}>{me?.name || 'You'}</div>
          <div className={styles.playerCardScore}>{me?.score ?? 0}</div>
        </div>
        {opponent && (
          <div className={`${styles.playerCard} ${(!iWon && !isTie && !opponentDisconnected) ? styles.playerCardWinner : ''}`}>
            <div className={styles.playerCardName}>{opponent.name}</div>
            <div className={styles.playerCardScore}>{opponent.score}</div>
          </div>
        )}
      </div>

      {opponentDisconnected && (
        <div className={styles.disconnected}>Your opponent disconnected</div>
      )}

      <div className={styles.buttons}>
        <button className={styles.btn} onClick={onPlayAgain}>
          Play Again
        </button>
        <button className={styles.backBtn} onClick={onBack}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}
