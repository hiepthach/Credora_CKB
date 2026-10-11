export interface ClusterConfig {
  name: string;
  description: string;
  websiteUrl?: string;
  contactEmail?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  issuerDid?: string;
}

export interface Cluster extends ClusterConfig {
  id: string;
  clusterId: string;
  creatorAddress: string;
  createdAt: string;
  updatedAt?: string;
  issuerDid?: string;
}

export interface ClusterWithCount extends Cluster {
  certificateCount?: number;
}
