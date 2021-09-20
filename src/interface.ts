interface Service {
  class: string;
  arguments?: string[];
  tags: Record<string, string>[];
}

export interface ServicesFile {
  services: Record<string, Service>;
}
