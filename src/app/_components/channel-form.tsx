"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import styles from "../index.module.css";
import accounts from "../_components/accounts.json";

const BATCH_SIZE = 10;

type SortField = 'eventCount' | 'videoCount' | 'codeCount';
type SortOrder = 'asc' | 'desc';

export function ChannelForm() {
  const utils = api.useUtils();
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [progress, setProgress] = useState(0);
  const [sortField, setSortField] = useState<SortField>('eventCount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const createChannel = api.channel.create.useMutation();

  const processBatch = async (startIndex: number) => {
    const endIndex = Math.min(startIndex + BATCH_SIZE, accounts.length);
    const batch = accounts.slice(startIndex, endIndex);
    
    console.log(`Processing batch ${currentBatch + 1}: channels ${startIndex} to ${endIndex}`);
    
    const promises = batch.map(account => 
      createChannel.mutateAsync({
        name: account.name,
        channelId: account.id,
        tag: account.tag 
      }).catch(error => {
        console.error(`Failed to add channel ${account.id}:`, error);
        return null;
      })
    );

    await Promise.all(promises);
    setProgress(endIndex);
    
    if (endIndex < accounts.length) {
      setCurrentBatch(prev => prev + 1);
      await processBatch(endIndex);
    } else {
      setIsAddingAll(false);
      setCurrentBatch(0);
      setProgress(0);
      await utils.channel.getAll.invalidate();
    }
  };

  const channels = api.channel.getAll.useQuery();

  const handleAddAll = async () => {
    if (isAddingAll || createChannel.isPending) return;
    
    setIsAddingAll(true);
    setCurrentBatch(0);
    setProgress(0);
    
    await processBatch(0);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to desc by default
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedChannels = channels.data?.slice().sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    return multiplier * ((a[sortField] ?? 0) - (b[sortField] ?? 0));
  });

  const existingChannelIds = new Set(channels.data?.map(c => c.channelId) ?? []);
  const remainingChannels = accounts.filter(a => !existingChannelIds.has(a.id));
  const totalBatches = Math.ceil(accounts.length / BATCH_SIZE);

  return (
    <div className={styles.showcaseContainer}>
      <h2>YouTube Channel Subscriptions</h2>

      <div className={styles.form}>
        <button
          onClick={handleAddAll}
          className={styles.submitButton}
          disabled={createChannel.isPending || isAddingAll}
        >
          {isAddingAll 
            ? `Processing Batch ${currentBatch + 1}/${totalBatches} (${progress}/${accounts.length} channels)` 
            : `Add All Channels (${channels.data?.length ?? 0}/${accounts.length})`}
        </button>
      </div>

      <div className={styles.channelList}>
        <div className={styles.listHeader}>
          <h3>Subscribed Channels ({channels.data?.length ?? 0}/{accounts.length})</h3>
          <div className={styles.sortButtons}>
            <button
              onClick={() => handleSort('eventCount')}
              className={`${styles.sortButton} ${sortField === 'eventCount' ? styles.active : ''}`}
            >
              Events {sortField === 'eventCount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('videoCount')}
              className={`${styles.sortButton} ${sortField === 'videoCount' ? styles.active : ''}`}
            >
              Videos {sortField === 'videoCount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('codeCount')}
              className={`${styles.sortButton} ${sortField === 'codeCount' ? styles.active : ''}`}
            >
              Codes {sortField === 'codeCount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {sortedChannels?.map((channel) => (
          <div key={channel.id} className={styles.channelItem}>
            <div className={styles.channelInfo}>
              <strong>{channel.name}</strong>
              {channel.tag && <span className={styles.tag}>{channel.tag}</span>}
            </div>
            <div className={styles.channelStats}>
              <div className={`${styles.stat} ${sortField === 'eventCount' ? styles.highlighted : ''}`}>
                <span className={styles.statLabel}>Events</span>
                <span className={styles.statValue}>{channel.eventCount}</span>
              </div>
              <div className={`${styles.stat} ${sortField === 'videoCount' ? styles.highlighted : ''}`}>
                <span className={styles.statLabel}>Videos</span>
                <span className={styles.statValue}>{channel.videoCount}</span>
              </div>
              <div className={`${styles.stat} ${sortField === 'codeCount' ? styles.highlighted : ''}`}>
                <span className={styles.statLabel}>Codes</span>
                <span className={styles.statValue}>{channel.codeCount}</span>
              </div>
              <span className={`${styles.status} ${channel.subscriptionVerified ? styles.statusVerified : styles.statusPending}`}>
                {channel.subscriptionVerified ? "Verified" : "Pending"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 