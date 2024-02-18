---
title: What’s PCIS+?
---

# What’s PCIS+?

- The data’s from the “Position and Classification Information System” (PCIS+). It’s TBS-OCHRO’s database of all the formal “boxes” and the on-paper org chart in the core public administration (most GC organizations / the ones that use standard classifications), regularly updated by departments. Because of this...
  - It’s accurate in the sense of showing all the boxes, but boxes / the on-paper org chart can definitely differ from people’s day-to-day org chart.
  - Reporting relationships, while captured in this dataset, thus aren’t 100% accurate, and it’s hard to know how inaccurate or not they are.
- The positions included are marked as either “vacant” or “occupied”. This encourages some caution in interpreting overall numbers:
  - When you see, for example, that there are ${groups[0]['n_positions'].toLocaleString()} positions in the ${groups[0]['group']} group, that means there are ${groups[0]['n_positions'].toLocaleString()} boxes classified with that group—far fewer of them are occupied.
  - Indeed, there’ll likely never be as many positions of a given group as there are boxes classified for that position, since it’s common to create extra boxes (due to the nature and incentives of the classification system).
  - For this analysis, there’s no filtering on whether positions are occupied or not—they’re all included.
- This analysis works primarily from the view of supervisors in a selected classification group—future analyses will explore other dimensions!
- The dataset was obtained through an access to information request. It reflects data in the PCIS+ system as of December 21, 2023. The boxes within an organization shift and change relatively frequently, and it’s unclear how quickly that data makes it back to TBS-OCHRO—so a given organization may well have changed since this export was provided.
- I plan to put together a more robust version of this down the line, with some more important caveats—this data can be easily misinterpreted, and I hope to help raise awareness of what it can and can’t be used to calculate. If you’ve been given this link, **please [check with me](https://lucascherkewski.com/contact/) before sharing it further**, at least for now. Thank you!!
