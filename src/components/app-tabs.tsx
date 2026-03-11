import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

const { Icon, Label, VectorIcon } = NativeTabs.Trigger;

export default function TabLayout() {
  return (
    <NativeTabs tintColor="#FF6B00">
      <NativeTabs.Trigger name="index">
        <Icon sf="house.fill" src={<VectorIcon family={MaterialIcons} name="home" />} />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="favorites">
        <Icon sf="star.fill" src={<VectorIcon family={MaterialIcons} name="star" />} />
        <Label>Favorites</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="news">
        <Icon sf="newspaper.fill" src={<VectorIcon family={MaterialIcons} name="newspaper" />} />
        <Label>News</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role="search">
        <Icon sf="magnifyingglass" src={<VectorIcon family={MaterialIcons} name="search" />} />
        <Label>Search</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
