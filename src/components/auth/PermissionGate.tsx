'use client';

interface Props {
  children: React.ReactNode;
}

export function PermissionGate({ children }: Props) {
  return <>{children}</>;
}