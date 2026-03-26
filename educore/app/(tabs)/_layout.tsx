import "react-native-gesture-handler";
import React from "react";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <Label>Home</Label>
        <Icon sf={"house.fill"} drawable="ic_menu_mylocation" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="exam">
        <Label>Exams</Label>
        <Icon sf={"magnifyingglass"} drawable="ic_menu_search" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <Label>Progress</Label>
        <Icon sf="gamecontroller" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="leaderboard">
        <Label>Leaderboard</Label>
        <Icon sf="gamecontroller" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf={"gear"} drawable="ic_menu_preferences" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
