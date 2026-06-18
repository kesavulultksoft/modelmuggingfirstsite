/**
 * Legacy marketing + testimonials copy from `modelmuggingwork/.../static/front/*.html`
 * (Angular template sources). Links stripped to plain text where noted.
 */

import type { MigratedPageDef } from '@/lib/migratedSitePages'

const p = (...lines: string[]) => lines

const def = (
  partial: Omit<MigratedPageDef, 'sections'> & { sections: MigratedPageDef['sections'] },
): MigratedPageDef => partial as MigratedPageDef

export const LEGACY_MARKETING_ARTICLE_PAGE_DEFS: Record<string, MigratedPageDef> = {
  'why-model-mugging-self-defense': def({
    title: 'Why Model Mugging self defense? | Model Mugging',
    description:
      'Model Mugging Self Defense provides students the greatest impact in personal safety and overcoming personal fears of being assaulted through role model mastery. Many self defense courses are simply comprised of a group of techniques without continuity between techniques, strategy, and the reality of effectiveness for women.',
    eyebrow: 'Why Model Mugging',
    keywords: ['why Model Mugging', 'full force self defense', 'women self defense research'],
    sections: [
      {
        heading: 'Why Model Mugging Self Defense?',
        paragraphs: p(
          'Violence against women is a crime against society! Safeguard yourself!',
          'Parents, safeguard your daughters going off to college by giving them a gift of personal awareness and safety that they can apply all their lives!',
          'Survivors of violence, change the ending into an empowered life!',
        ),
      },
      {
        heading: 'What Makes The Model Mugging Program Different?',
        paragraphs: p(
          'Model Mugging Self Defense provides students the greatest impact in personal safety and overcoming personal fears of being assaulted through role model mastery. Many self defense courses are simply comprised of a group of techniques without continuity between techniques, strategy, and the reality of effectiveness for women.',
        ),
      },
      {
        heading: 'Why the Name — Model Mugging?',
        paragraphs: p(
          'In 1971, Model Mugging founder Matt Thomas originally called the program "Role Model Rape Prevention" based on Role Model Mastery work by psychologist Albert Bandura—mechanisms governing empowerment for overcoming fear of snakes, flying, and similar threats. Matt applied these principles in helping women overcome the fear of rape through rape defense.',
          'While Matt developed the Model Mugging self defense curriculum, he was a student of Bandura. Almost 20 years later, Elizabeth Ozer and Albert Bandura conducted a personal empowerment over physical threats experiment with women applying the role Model Mugging mastery program.',
          'During classes, students called him the "Mugger" when wearing the padded assailant during full force scenarios. Students found that label psychologically less threatening. Matt changed the name to "Role Model Mugging", later shortened to "Model Mugging" in 1973.',
          'Course content and instruction are modeled upon practical and proven methods for how women can successfully defend themselves against common assault scenarios, thus the brand name Model Mugging.',
          'The program is taught by a female and male instructor team. The female instructor models the transformation of fear into empowerment while the male instructor, in the padded suit, models assailants so students gain experience practicing more realistic options.',
        ),
      },
      {
        heading: 'Realistic Self Defense',
        paragraphs: p(
          'Instruction is based on modeling the stark realism of what happens when assailants attack women so that the training closely mirrors reality.',
          'The curriculum is progressive and culminates in full speed, full contact, and the full spectrum of options.',
          'The course is modeled on data that captured how women are actually assaulted and then authentically simulates these scenarios, which is constantly updated.',
          'No advance martial arts training is required. Even if you have not taken martial arts, kick-boxing, or are not particularly athletic, this class is for you—and if you take it, you will be changed for good.',
        ),
      },
      {
        heading: 'Self Defense Designed for Women',
        paragraphs: p(
          'Model Mugging is the original Adrenaline Stress Training course, established from crime analysis, and organized upon the Five Principles of Self-Defense.',
          'The Model Mugging curriculum is founded on researching thousands of crimes, review of academic literature, martial arts, and decades of experience conducting reality based self defense scenarios.',
          'Model Mugging programs are specifically designed for the special needs of women. Since 1971, this martial science self defense system has developed into a short, effective full force fighting and crime prevention course.',
        ),
      },
      {
        heading: 'Self Defense in a Weekend',
        paragraphs: p(
          'The course conveniently fits into busy lifestyles. It may be available on weekends or in short modules close to where you live for those interested in hosting a course.',
          'Women who have taken this class describe how the methods touch them in ways that change their lives immediately. Personal testimonials illustrate life-saving effectiveness—sometimes long after the course is taken.',
          'Small groups maintain personalized instruction while keeping training affordable—especially for families sending a daughter to college.',
        ),
      },
      {
        heading: 'Facets of the Model Mugging program',
        paragraphs: p(
          '• Supportive Designed Self Defense Program',
          '• Padded Assailant',
          '• Female Co-Instructors',
          '• Muscle Memory / Operant Conditioning',
          '• Emotions and Self-Confidence',
          '• PTSD and Self Defense',
          '• Progressive Training and Controlled Stress',
          '• Feminine Empowerment',
          '• Gentle Art of Conflict De-Escalation',
          '• Personal Defense and Crime Prevention',
        ),
      },
      {
        heading: 'Self Defense Classes',
        paragraphs: p(
          'In just one weekend, the Model Mugging Basic Self Defense Course provides crime prevention education and the fighting experience needed to successfully defend oneself against a single unarmed assailant. Workshops are also available.',
          'Another weekend of training is the Advanced course, addressing options against an armed assailant and multiple assailants.',
        ),
      },
    ],
  }),

  'crime-prevention': def({
    title: 'Crime prevention & safety awareness | Model Mugging',
    description:
      'Intra-specie predation is a part of our human evolutionary existence. We live in a violent world that can sometimes limit our daily choices, mobility, and associations. Knowing how violent criminals victimize others and learning how to avoid potentially dangerous situations are critical components of the crime prevention cycle.',
    eyebrow: 'Why Model Mugging',
    keywords: ['crime prevention', 'safety awareness', 'self defense'],
    sections: [
      {
        heading: 'Crime Prevention Tips',
        paragraphs: p(
          'MODEL MUGGING research indicates that over 80% of sexual assaults are preventable when appropriate crime prevention precautions are applied. Both women and men can employ crime prevention steps to reduce chances of becoming a crime victim.',
        ),
      },
      {
        heading: 'Crime Safety',
        paragraphs: p(
          'Intra-specie predation is a part of our human evolutionary existence. We live in a violent world that can sometimes limit our daily choices, mobility, and associations. Knowing how violent criminals victimize others and learning how to avoid potentially dangerous situations are critical components of the crime prevention cycle. Model Mugging crime precaution uses an educational method that teaches students about criminal activity, personal safety, crime prevention techniques and tactics that help adjust lifestyles to thwart future criminal predation. Techniques for avoiding danger are among the best women self-defense tips.',
          'There are crime prevention steps women and men can take to reduce the chances of being victimized. Generally, women are physically more vulnerable than men, but women may be more perceptive to potential danger than men. In contrast, there are many places of danger men will avoid, and there are also places police officers will not enter without adequate backup.',
          'Crime prevention is about finding personal safety. We live in a violent world and sometimes we must limit our movement and choices to better avoid danger. Applying crime prevention measures may create disappointment and even invoke anger about having to change plans, or having our wishes and immediate goals obstructed. These incidents reinforce the crime prevention maxim that it is better to be "safe than sorry".',
          'In her 1973 Denver study on rape, Carolyn Hursch (1977) found that 40% of the rapes reported could have been prevented by simply taking basic crime prevention precautions.',
          'Through more developed and detailed criminal assessment experience, Model Mugging research shows over 80% of sexual assaults may be preventable by applying crime prevention precautions. Graduates from the Basic Self-Defense Course gain knowledge about criminal tactics that can be used to develop boundary setting and conflict resolution skills, which can further reduce assault by up to 95%.',
        ),
      },
      {
        heading: 'Urban Jungle vs. the Tropical Jungle',
        paragraphs: p(
          'Crime prevention and personal safety is akin to walking through a dense, humid jungle. Tropical jungles contain many potential dangers: changing weather, difficult terrain, poisonous snakes, plants, bugs, and big predators.',
          'Similarly, the concrete jungles of urban life include potential threats such as robbers, rapists, burglars, con artists, and thieves. Some of the less obvious but more dangerous urban predators are abusive intimate partners, acquaintance rapists, disgruntled employees, stalkers, terrorists, and deranged killers. As in tropical jungles, survival in an urban jungle requires awareness, knowledge about predators, and the tools and ability to protect oneself.',
        ),
      },
      {
        heading: 'Crime Prevention Strategies',
        paragraphs: p(
          'Life involves risk. There are no security hardware or foolproof techniques that can guarantee protection of property or personal safety. Because we live in a changing world, personal safety is never absolute.',
          'Crime prevention contradictions may appear in dangerous situations where options may be separated between bad and worse. The best crime prevention process develops ideas and options for safety, but still cannot provide a guarantee to be crime free. Recognizing potential threats and knowing counter measures makes it difficult for predators to capitalize upon opportunities.',
          'There will be times when you are vulnerable to criminal attack, but acknowledging vulnerability allows you to position yourself for increased safety and more options for extrication. It is impossible to follow all potential precautions every day.',
          'Paying attention to news stories about criminal behaviors adds awareness regarding your changing surroundings. Learning proactive measures and new personal safety techniques deters criminals—often described as "hardening the target".',
          'For criminals who get through layers of prevention and isolate victims, practical self-defense training develops realistic options to stop their intentions, often without having to fight.',
        ),
      },
      {
        heading: 'Crime Prevention Updates',
        paragraphs: p(
          'Crime prevention tips are posted periodically. Join the contact list or follow announcements to be notified of updates across safety categories including awareness, crimes within relationships, protecting children, personal safety, home safety, vehicle safety, and travel safety.',
        ),
      },
    ],
  }),

  'about-self-defense': def({
    title: 'About self defense | Model Mugging',
    description: 'Resources about Self Defense — topics for resources and more information about self defense.',
    eyebrow: 'Resources',
    keywords: ['about self defense', 'self defense resources', 'Model Mugging'],
    sections: [
      {
        heading: 'Resources about Self Defense',
        paragraphs: p(
          'Topics for resources and more information about self defense:',
          '• Self Defense Designed for Women',
          '• Graduate Testimonials',
          '• Martial Science',
          '• Choices in Self Defense',
          '• Self Defense Articles',
          '• Crime Prevention',
          'Open the class schedule or training overview on this site for next steps toward a course near you.',
        ),
      },
    ],
  }),

  'self-defense-videos': def({
    title: 'Self defense videos | Model Mugging',
    description:
      'Video resources introducing Model Mugging training methodology and graduate perspectives—complement to in-person graduation.',
    eyebrow: 'Resources',
    keywords: ['self defense videos', 'Model Mugging', 'video testimonials'],
    sections: [
      {
        heading: 'Video resources',
        paragraphs: p(
          'Model Mugging uses video to introduce the padded-assailant methodology, course intensity, and graduate experience. Video helps you understand what makes full-force training different from lecture-only formats.',
          'Flagship overview (legacy site embed): https://www.youtube.com/watch?v=yG4COqu_7wQ',
          'Video complements but does not replace in-person graduation—you still practice under coaching against professional padding in class.',
          'Browse self-defense testimonials and success stories on this site for written graduate perspectives alongside video.',
        ),
      },
    ],
  }),

  'about-us': def({
    title: 'About us | Model Mugging',
    description:
      'Model Mugging instructors—background, mission, and how male and female instructor teams support graduates.',
    eyebrow: 'About',
    keywords: ['about Model Mugging', 'instructors', 'self defense organization'],
    sections: [
      {
        heading: 'About Us',
        paragraphs: p(
          'Instructors have martial arts experience in a variety of styles and disciplines. Some are law enforcement officers, have military backgrounds, counseling, and other specialties. They have studied criminal typologies and have experience attending to survivors of assaults as first and secondary responders.',
          'Male instructors are trained to wear the body armor safely. They learn the dynamics in which predators operate so they can best help students during full contact scenarios. They wear about fifty pounds of protective equipment that is extremely hot and fatiguing so students can avoid future victimization. They define the warrior spirit in their acts of giving and individual sacrifice.',
          'Female instructors are crucial to Model Mugging training. They are the role models for students to emulate. They never leave their students’ side and coach each one to personal victory. They are familiar with the equipment and understand what students are going through—after all, they were students themselves and have graduated from multiple classes and Advanced Model Mugging courses. They have exceptional technique and strategy during full contact fighting, training in rape crisis advocacy, and skill with the emotions the course raises. Most of all they lead you to some of the greatest feelings of empowerment any course can offer.',
          'Background summary on your primary instructor: law enforcement experience investigating crime from burglaries and rapes to homicides; arrest and control tactics, baton, and self-defense instruction for law enforcement; military police experience; anti-terrorism and physical security training; Model Mugging instruction since 1989; master’s degree in forensic psychology; research into sexual assault since the late 1980s; development of body armor improvements for certified Model Mugging instructors.',
          'Southern California — Los Angeles based: for over twenty years based in Los Angeles, serving Southern California including Los Angeles, Orange County, Riverside and the Inland Empire, San Diego County, and Ventura County. Chapters have also formed in Northern California, Seattle, Dallas, and Colorado.',
        ),
      },
    ],
  }),

  'self-defense-testimonials': def({
    title: 'Self defense testimonials | Model Mugging',
    description: 'MODEL MUGGING SELF DEFENSE TESTIMONIALS',
    eyebrow: 'Testimonials',
    keywords: ['self defense testimonials', 'Model Mugging graduates', 'success stories'],
    sections: [
      {
        heading: 'MODEL MUGGING SELF DEFENSE TESTIMONIALS',
        paragraphs: p(
          '"Imitation is the sincerest form of flattery." — Charles Colton',
        ),
      },
      {
        heading: 'First in full-force self defense',
        paragraphs: p(
          'Since the mid 1980s Model Mugging concepts have been copied by many martial arts groups, other women’s self defense programs, and law enforcement worldwide. Model Mugging was the first full force self defense course developed. The first formally written article about Model Mugging and full force self defense was "Getting Tough About Rape," published in Human Behavior Magazine (1978).',
          'The revolutionary research and computation of learning dynamics was integrated by Matt Thomas who defined martial science. The protective armor known as the padded assailant is the most noticeable characteristic of Model Mugging and the most copied aspect of the program. However, many other dynamics provide students with life-changing experiences. The body armor confirmed teaching methodologies and research performed prior to teaching the first full force Model Mugging class.',
          'Model Mugging continues to lead in first-source research in self-defense and personal safety. Updated research and teaching make Model Mugging an advanced program for options that help students improve personal safety and well-being. Realistic crime prevention and personal safety writing helps readers apply methods to avoid danger.',
          'The most common testimonial is the life-changing transformation experienced by graduates. We receive many requests from graduates who took the course in their twenties and now want their daughters to experience the freedom of having more options in daily life. We cannot teach invincibility, but we do offer knowledge from which women can more accurately select options if confronted with danger.',
          'Model Mugging graduates continuously comment how they have enjoyed happier and more fulfilling lives after taking the self-defense course.',
          '"This Course Is A Life Changer!"',
        ),
      },
      {
        heading: 'Explore testimonial themes',
        paragraphs: p(
          'Continue to personal graduate letters, success rate research, common themes in testimonials, life-saving accounts, success stories, and video resources using the links below.',
        ),
      },
    ],
  }),

  'personal-testimonials-model-mugging-graduates': def({
    title: 'Personal testimonials from graduates | Model Mugging',
    description: 'Personal Testimonials — first-person letters from Model Mugging graduates.',
    eyebrow: 'Testimonials',
    keywords: ['Model Mugging testimonials', 'graduate stories'],
    sections: [
      {
        heading: 'Model Mugging Self-Defense Course Testimonials',
        paragraphs: p('"This Self-Defense Course Will Change Your Life!"'),
      },
      {
        heading: 'NANCY — 1990s graduate',
        paragraphs: p(
          '"Model Mugging was a turning point in my life, and I am profoundly grateful for the experience. The value this class delivered, and continues to deliver decades later for me. Model Mugging was the best value out there for delivering meaningful life skills and undoing some of the horrific damage delivered on my life by cycles of abuse. Against all odds, I have a kind, gentle husband and a smart, loving daughter. I doubt my life would have had this outcome without all the work I did during that tumultuous period of my life, and Model Mugging was the cornerstone of it all. Thanks for the important work you do."',
        ),
      },
      {
        heading: 'SANDRA — Munich graduate',
        paragraphs: p(
          '"What a great experience! I am still totally overwhelmed. I can\'t believe what happened during the last two days. I have never felt such physical power. It is part of myself now and I\'m sure it will strengthen me during my life. Thank you for your passion, your power, and for spreading your spirit to Germany now!"',
        ),
      },
      {
        heading: 'LEAH — Seattle graduate',
        paragraphs: p(
          '"I am now 78. I took the class in Seattle in 1989. It was a profound experience. Although I had never been attacked prior to taking the course, I did move through the world with a lot of fear. The class allowed me to release the fears around my physical safety which I have since carried throughout my life. What I learned in Model Mugging is a part of me and still gives me the confidence to believe that if a physical threat does happen I stand a pretty good chance of defending myself. My granddaughter will be graduating high school next year and the best gift I can give her is a course before she graduates."',
        ),
      },
      {
        heading: 'JESSICA — Orange County graduate',
        paragraphs: p(
          '"It was a wonderful experience that I will never forget. I had just told my therapist about it and she can also see the change in me that occurred during the course. She wanted to know more about Model Mugging so that she could recommend it to her friends and other patients who are still having an unbearable amount of trouble dealing with their experience of sexual assault. My boyfriend has told me recently that ever since I took the class I have been a happier person, even compared to before my encounter with sexual assault, and I am more confident in myself. Thank you so much for showing me how strong I REALLY am!"',
        ),
      },
      {
        heading: 'ROBBIE — Seattle graduate',
        paragraphs: p(
          '"A month after class, I am still living in the afterglow of empowerment! I thank you for such a life changing program! I really liked the format of class time and drills. And of course, the fights were a rush of emotion, energy, adrenaline and empowerment! I hope I never have to use it but am happy I have a can of whoop-ass in my back pocket. I so appreciate all of your time and effort in teaching such a powerful course! Thank you again!"',
        ),
      },
      {
        heading: 'TOM and AMIDEI — parents of a Denver graduate',
        paragraphs: p(
          '"As parents, one of the worst feelings in the world is knowing your child is being hurt or is in a dangerous situation. The feeling of helplessness is overwhelming. When this happened to our family, it became a huge priority to do anything we could to help protect our daughter. Step in Model Mugging! As a graduate of this program over 25 years ago, I knew the impact and life altering changes this class could make."',
          'They describe how their daughter used training within a month to get out of an aggressive situation, and within several months gained the strength to leave an abusive relationship—and how she blossomed again.',
        ),
      },
    ],
  }),

  'success-rate-of-graduates-fighting-back': def({
    title: 'Success rate of graduates fighting back | Model Mugging',
    description:
      'In the real world, we don’t know what we don’t know. The following data should be interpreted with caution because there are individual and personal factors that influence the reporting of both sexual and non-sexual assaults. Our knowledge is only based on what our students or their families have reported back to us.',
    eyebrow: 'Testimonials',
    keywords: ['Model Mugging success rate', 'graduates fighting back'],
    sections: [
      {
        heading: 'Stopping Violence Against Women',
        paragraphs: p(
          'In the real world, we don’t know what we don’t know. The following data should be interpreted with caution because there are individual and personal factors that influence the reporting of both sexual and non-sexual assaults. Our knowledge is only based on what our students or their families have reported back to us.',
          'The Department of Justice reports approximately 20% of women will be sexually assaulted in their lifetime in the United States (Tjaden & Thoennes, 1998). Various rape crisis centers report victimization rates much higher with carried reporting rates around 10% of survivors reporting the crime to police. Many survivors have a greater chance of being victimized repetitively, which has been confirmed by many students who shared prior histories of assault in a variety of forms.',
        ),
      },
      {
        heading: 'Graduate outcomes (reported)',
        paragraphs: p(
          'Based on our students’ reports, a Model Mugging graduate’s chance of being sexually assaulted is significantly lower than women without proper self-defense training. Well over 60,000 women have graduated from Model Mugging self-defense courses worldwide. Over 59,000 students never reported assaults afterwards (98.3% success in avoiding attacks).',
          'Another 800 Model Mugging graduates who were threatened with assault stopped their assailant with just their voices and body language (80% success when attacked without resorting to violence). Incidents reported back to us total 221 graduates involved in a physical attack since taking the program on an average of two and a half years after graduating. Of those 221 assaults, 214 (97%) graduates successfully fought off their attacker.',
          'Out of over 60,000 graduates, only seven students reported that they were victimized in ways counted in this analysis. These graduates all survived, which is a significant victory. We only can report what is reported back to us—we don’t know what we don’t know.',
        ),
      },
      {
        heading: 'Context and caveats',
        paragraphs: p(
          'We don’t have a statistically relevant control group of untrained women matched by age, socioeconomic status, and occupation. Over a forty-year period, graduates have had different numbers of years after training and various histories. Individual results vary; training increases options, not guarantees.',
          'Fighting back gives women the best documented results of stopping an attack, but fighting back does not guarantee success and consequences can include severe injury or death—as with other response options. Model Mugging teaches the full spectrum of options so graduates can apply what they deem most appropriate.',
        ),
      },
    ],
  }),

  'four-common-self-defense-testimonials': def({
    title: 'Four common self defense testimonial themes | Model Mugging',
    description:
      'Four Steps to Self-defense summarized by the acronym P A R R (Robert Koga). Proper self-defense training for women should, at a minimum, incorporate four basic steps.',
    eyebrow: 'Testimonials',
    keywords: ['self defense testimonials', 'Model Mugging', 'PARR'],
    sections: [
      {
        heading: 'Four Steps to Self Defense',
        paragraphs: p(
          'Four Steps to Self-defense can be summarized by the acronym P A R R (Robert Koga). Proper self-defense training for women should, at a minimum, incorporate four basic steps.',
          '• Prepare for dealing with hazardous situations and violence, which is done through proper and adequate training.',
          '• Anticipate potential threats and hazards through awareness that may be present anywhere you are.',
          '• Recognize actual hazardous situations and threatening people.',
          '• Respond properly to threatening situations and people. Response requires rapid evaluation of the immediate threat and your capabilities while understanding strategies and options available to you.',
          'The application of these four steps allows you to avoid danger whenever possible, but also apply physical self-protection when necessary.',
        ),
      },
      {
        heading: 'Stay Out of the Victim Pool',
        paragraphs: p(
          'There is a story about two hikers who encountered a ferocious grizzly bear moving toward them. One hiker immediately stopped, bent down, and started to tighten his shoelaces. The other scoffed: "You can’t outrun a grizzly. A man can only run about fifteen miles an hour, while a grizzly can top 35mph." The other hiker replied: "I don’t have to outrun the grizzly, I just have to outrun you!" (Thomas & Bishop 1993)',
          'Self-defense training helps you avoid being the easiest target in the "victim pool" predators scan for.',
        ),
      },
    ],
  }),

  'model-mugging-saved-my-life': def({
    title: '“Model Mugging saved my life” | Model Mugging',
    description:
      'Graduate account by Linda Simeone — how Model Mugging training contributed to surviving a knife attack by someone she knew.',
    eyebrow: 'Testimonials',
    keywords: ['Model Mugging saved my life', 'self defense success'],
    sections: [
      {
        heading: 'Model Mugging Saved My Life',
        paragraphs: p('— by Linda Simeone', '"Oh! No! This has got to be a dream, a nightmare!" I thought when a friend of seventeen years took a knife from his belt and rushed toward me.'),
      },
      {
        heading: 'Background',
        paragraphs: p(
          'I had known Bob for well over seventeen years. We dated, lived together, broke up amiably, and vowed to always remain friends. Unfortunately, most crime statistics show the majority of violence is committed by someone the victim knew relatively well. I am no exception.',
          'Bob was ill with epilepsy; his condition had manifested in recurring bouts of paranoia and psychotic episodes. At 1:30 a.m. he arrived at my apartment with a pass key. His mood was spooky; I was very fearful but let him stay the night while I slept on the couch. In the morning he seemed better; I decided to drive him to his boat in Long Beach.',
        ),
      },
      {
        heading: 'The attack',
        paragraphs: p(
          'On the dock he unfolded a hunting knife and charged me from less than six feet away. I dropped immediately to the ground—what my instructor had said to do when facing a serious attack so you never fight a man on his terms.',
          'He lunged; I kicked; he tried to plunge the knife into my stomach. I doubled over, blocking with my hands. We struggled; I kicked the knife off the dock into the water, pushed him into the water, and ran screaming for help.',
        ),
      },
      {
        heading: 'What police said',
        paragraphs: p(
          'The first officer could not believe I survived with little more than scratches. "What the hell did you do, lady?" "Model Mugging. I dropped to the ground first thing." "That course and your instructor saved your life."',
          'I am thoroughly convinced it was training through Model Mugging Self Defense that allowed me a second chance at life.',
        ),
      },
    ],
  }),

  'self-defense-success-stories': def({
    title: 'Self defense success stories | Model Mugging',
    description:
      'How Model Mugging research, the padded assailant, and graduate experiences fit together—written context for success stories across decades.',
    eyebrow: 'Testimonials',
    keywords: ['self defense success stories', 'Model Mugging'],
    sections: [
      {
        heading: 'Success stories in context',
        paragraphs: p(
          'Since the mid 1980s Model Mugging concepts have been copied worldwide—but Model Mugging was the first full force self defense course developed, with research and teaching methodology that predates imitation.',
          'Graduates describe life-changing transformation: confidence, clearer boundaries, and—when necessary—effective resistance. Success stories are shared with permission; each reflects personal experience, not a promise of future outcomes.',
          'Combine reading with scheduling a course so your body learns under stress with professional coaching and padding—not theory alone.',
        ),
      },
    ],
  }),
}
