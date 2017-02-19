== AI competition bot ==

For a competition where a series of bots will connect over websockets to a server. While connected, the server will send packets containing information about the game, which takes place on a grid. Food, and other bots, will be located (randomly?) throughout the grid. Bots will reply with a movement in any cardinal direction, or stay still. If movement takes them over a point on the grid that contains food, they will accrue a point and the food will be removed. If two players collide (at the end of a turn) they will both be destroyed and be unable to continue collecting food.

As a result of the one-movement-per-turn mechanic, turns ``t`` limits score ``s`` to a maximum of ``s <= t`` at all times. This means that to maximize score, we want to minimize turns where score is not being collected. While an initial "greedy" algorithm sounds ideal, it actually has weaknesses if we do not look far enough ahead.

Consider a scenario where ``f`` is food and ``@`` is the bot: ``ff @ f `` 
If the bot does not look far enough ahead, both left or right appear to be equally fast to collect the closest food choices (ala greedily). Instead, we see that:
* Moving left will give 2 food within 3 turns
** It would take 8 turns to collect all 3
* Moving right will give 1 food in 2 turns
** It would take 7 turns to collect all 3
This leaves us with a decision between greed and efficiency. In this example, it's better to be less greedy at the start for better efficiency afterward. Despite this, I think this is non-ideal for this competition. Because other bots will also be collecting food at the same time, we cannot guarantee that a food will be available at any point in the future. Thus, while some look-ahead is good, looking too far ahead is liable to cause us issues where food we had planned for (by maximizing efficiency for future turns) is now gone as a result of other player's actions.

As a result, the plan I intend is a combination of greed and efficiency that I am describing as "Greedy Lookahead". This is a primarily "greedy" AI that will choose the closest foods, but if there are more than one within the same turn range we do a check to see which food source is connected to the most other foods! Essentially, by finding out if there are adjacent (available within 1 turn after) foods, we determine if one of the foods has more potential for future greed. The plan is to use a "flood fill" algorithm to obtain a weight of each group. This may also tell us if they're interconnected (for example, if we're in a cluster).

While it's likely that most other bots will be self-perserving (will avoid player/player contact), we cannot assume 100% that this is so. This will lead to a Prisoner's Dilemma situation where if we both go for the same food we will both lose out. As a result, I intend to ensure that points that are adjacent to other bots are marked as "threatened" and are avoided if at all possible.

Finally, as noted above, we cannot look too far into the future because the domain will be constantly changing as a result of the other players. Because of this, the bot will only look for individual foods within a certain range of turns at maximum. All other space in the grid will be separated into sectors where the total food is summed or averaged into a weight for the sector. In this way, we can simplify the local calculations of the bot while still enabling a bit of global awareness. This will be handy when the local area is depleted or low, and we need to start shifting movement toward areas that have additional reserves available.

Note; because movement is in the cardinal directions, distances need to be measured in _Manhattan_ scale, not using  actual (fractional) distances.

OOPS: food is not 1 per cell, but varies! This has ramifications...
