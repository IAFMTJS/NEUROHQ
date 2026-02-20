"use client";

import { Fragment } from "react";

type SkillNode = {
  id: string;
  label: string;
  unlocked: boolean;
};

type Props = {
  skills: SkillNode[];
};

export function CommanderSkillTree({ skills }: Props) {
  // Ensure we always render exactly 3 skills for consistent DOM structure
  // This prevents hydration mismatches
  const displaySkills = skills.length >= 3 
    ? skills.slice(0, 3)
    : [
        ...skills,
        ...Array.from({ length: 3 - skills.length }, (_, i) => ({
          id: `placeholder-${i}`,
          label: "",
          unlocked: false,
        })),
      ];

  return (
    <section className="skill-tree page">
      {/* Op grote schermen: alle 3 naast elkaar */}
      <div className="skill-tree-row skill-tree-row-all">
        {displaySkills.map((skill, i) => (
          <Fragment key={skill.id || `skill-${i}`}>
            <div className={`skill-node ${skill.unlocked ? "unlocked" : "locked"}`}>
              {skill.label && <div className="node-inner">{skill.label}</div>}
            </div>
            {i < displaySkills.length - 1 && <div className="skill-connector" />}
          </Fragment>
        ))}
      </div>
      
      {/* Op kleine schermen: 2 boven, 1 onder - Always render for consistent DOM */}
      <div className="skill-tree-row skill-tree-row-top">
        {displaySkills.slice(0, 2).map((skill, i) => (
          <Fragment key={`top-${skill.id || i}`}>
            <div className={`skill-node ${skill.unlocked ? "unlocked" : "locked"}`}>
              {skill.label && <div className="node-inner">{skill.label}</div>}
            </div>
            {i < 1 && <div className="skill-connector" />}
          </Fragment>
        ))}
      </div>
      <div className="skill-tree-row skill-tree-row-bottom">
        <div className={`skill-node ${displaySkills[2]?.unlocked ? "unlocked" : "locked"}`}>
          {displaySkills[2]?.label && <div className="node-inner">{displaySkills[2].label}</div>}
        </div>
      </div>
    </section>
  );
}
