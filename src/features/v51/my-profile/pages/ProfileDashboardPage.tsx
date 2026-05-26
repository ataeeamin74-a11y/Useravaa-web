import { getDashboardFixture, type MyProfileDashboardFixture } from "@/features/v51/data/my-profile";
import styles from "../components/MyProfile.module.css";
import { ProfileDashboardClient } from "./ProfileDashboardClient";

type ProfileDashboardPageProps = {
  fixture?: MyProfileDashboardFixture;
  state?: string | null;
  activeQuestionAnswered?: boolean;
};

export function ProfileDashboardPage({ fixture, state, activeQuestionAnswered = true }: ProfileDashboardPageProps) {
  const dashboard = fixture ?? getDashboardFixture(state);

  return (
    <div className={styles.dashboardShell}>
      <ProfileDashboardClient fixture={dashboard} activeQuestionAnswered={activeQuestionAnswered} />
    </div>
  );
}
