"use client";

import React from "react";
import styles from "./hud.module.css";

export type StarFieldProps = {
  className?: string;
};

/**
 * Subtle static star/speck layer.
 */
export function StarField({ className = "" }: StarFieldProps) {
  return <div className={`${styles.starField} ${className}`.trim()} aria-hidden="true" />;
}

