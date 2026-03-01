"use client";

import { Fragment } from "react";

export type SkillNode = {
  id: string;
  label: string;
  unlocked: boolean;
  /** Why locked / what to do to unlock (shown as tooltip when locked). */
  tooltipText?: string | null;
};

type Props = {
  skills: SkillNode[];
};

export function CommanderSkillTree({ skills }: Props) {
  const displaySkills = skills.length >= 3
    ? skills.slice(0, 3)
    : [
        ...skills,
        ...Array.from({ length: 3 - skills.length }, (_, i) => ({
          id: `placeholder-${i}`,
          label: "",
          unlocked: false,
          tooltipText: null as string | null,
        })),
      ];

  function renderNode(skill: SkillNode, index: number) {
    const title =
      skill.unlocked
        ? `${skill.label} — ontgrendeld`
        : skill.tooltipText
          ? `${skill.label} (locked): ${skill.tooltipText}`
          : skill.label
            ? `${skill.label} — level nodig om te ontgrendelen`
            : "";
    return (
      <div
        key={skill.id || `skill-${index}`}
        className={`skill-node ${skill.unlocked ? "unlocked" : "locked"}`}
        title={title}
        role="img"
        aria-label={skill.label ? `${skill.label}, ${skill.unlocked ? "ontgrendeld" : "gesloten"}` : undefined}
      >
        {skill.label && <div className="node-inner">{skill.label}</div>}
        {!skill.unlocked && skill.tooltipText && (
          <span className="sr-only">{skill.tooltipText}</span>
        )}
      </div>
    );
  }

  return (
    <section className="skill-tree page" aria-label="Skill tree">
      <div className="skill-tree-row skill-tree-row-all">
        {displaySkills.map((skill, i) => (
          <Fragment key={skill.id || `skill-${i}`}>
            {renderNode(skill, i)}
            {i < displaySkills.length - 1 && <div className="skill-connector" aria-hidden />}
          </Fragment>
        ))}
      </div>
      <div className="skill-tree-row skill-tree-row-top">
        {displaySkills.slice(0, 2).map((skill, i) => (
          <Fragment key={`top-${skill.id || i}`}>
            {renderNode(skill, i)}
            {i < 1 && <div className="skill-connector" aria-hidden />}
          </Fragment>
        ))}
      </div>
      <div className="skill-tree-row skill-tree-row-bottom">
        {displaySkills[2] && renderNode(displaySkills[2], 2)}
      </div>
    </section>
  );
}
