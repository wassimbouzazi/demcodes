"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import styles from "../index.module.css";

export function ChannelForm() {
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState("");

  const createChannel = api.channel.create.useMutation({
    onSuccess: async () => {
      await utils.channel.getAll.invalidate();
      setName("");
      setChannelId("");
    },
  });

  const channels = api.channel.getAll.useQuery();

  return (
    <div className={styles.showcaseContainer}>
      <h2>YouTube Channel Subscriptions</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createChannel.mutate({ name, channelId });
        }}
        className={styles.form}
      >
        <input
          type="text"
          placeholder="Channel Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="Channel ID"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className={styles.input}
        />
        <button
          type="submit"
          className={styles.submitButton}
          disabled={createChannel.isPending}
        >
          {createChannel.isPending ? "Adding..." : "Add Channel"}
        </button>
      </form>

      <div className={styles.channelList}>
        <h3>Subscribed Channels</h3>
        {channels.data?.map((channel) => (
          <div key={channel.id} className={styles.channelItem}>
            <strong>{channel.name}</strong>
            <span>ID: {channel.channelId}</span>
            <span>
              Status:{" "}
              {channel.subscriptionVerified ? "Verified" : "Pending Verification"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 