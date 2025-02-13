import { ChannelForm } from "~/app/_components/channel-form";
import { HydrateClient } from "~/trpc/server";
import styles from "./index.module.css";

export default function Home() {
  return (
    <HydrateClient>
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>
            YouTube Channel <span className={styles.pinkSpan}>Monitor</span>
          </h1>
          <ChannelForm />
        </div>
      </main>
    </HydrateClient>
  );
}
