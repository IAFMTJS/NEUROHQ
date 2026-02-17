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
  return (
    <section className="skill-tree page">
      {skills.map((skill, i) => (
        <Fragment key={skill.id}>
          <div className={`skill-node ${skill.unlocked ? "unlocked" : "locked"}`}>
            <div className="node-inner">{skill.label}</div>
          </div>
          {i < skills.length - 1 && <div className="skill-connector" />}
        </Fragment>
      ))}
    </section>
  );
}
