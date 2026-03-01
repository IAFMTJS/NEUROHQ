"use client";

import React from "react";
import styles from "./hud.module.css";

export type Divider1pxProps = {
  className?: string;
};

export function Divider1px({ className = "" }: Divider1pxProps) {
  return <div className={`${styles.divider} ${className}`.trim()} aria-hidden="true" />;
}

