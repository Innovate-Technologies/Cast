# Cast 1.0

Cast is a modern streaming solution built to accomodate the demands of modern radio streaming.
The 90s have long since passed, it's time that we pass with it.

## Pillars

0. Hackability

    Cast is built to be _hacked_ to suit your needs.
    It's your streaming server, why shouldn't it be tailored exactly how you want it to be?
    Cast is built especially with this in mind.
    We made hooks that makes data sharing to your site, app or spaceship super easy! Fork away.

0. Compatibility

    Cast is built to work with all of the widely used streaming standards in an innovative way.
    If you use Icecast or SHOUTcast, you'll be able to use Cast in exactly the same way.
    No complications, welcome to the 21st century.

0. Innovation

    The clue's behind the name, **Innovate** Technologies.
    Cast is built on the definition of innovation.
    The 90s were dull, boring and most importantly; 15 years ago.
    Cast promises an innovative solution to streaming.
    Combining clever, modern code with a beautiful UI; you really can't go wrong.

## Documentation

You can find our official documentation on [cast.readme.io/docs](https://cast.readme.io/docs).
Thanks a lot to the team at readme.io for sponsoring us!

## Installation

Installing Cast is quite simple. All you need is a computer with Node.js installed.
First of all, get a copy of this repo (via a zip file or git).
Then run `npm install` and `node server.js`.

## Motivation

Before Cast, there was Icecast and SHOUTcast. Sure, they _work_.
The problem with both of them is that they're based on code written by exhausted developers in _you guessed it_, the nineties.
This doesn't make either of them bad, it just means it may not be for everyone.
It makes using Icecast and SHOUTcast a little more difficult than we think it has to be,
so we've built Cast from the ground up using Node.js to reduce the tears and increase the laughs.

We have years of experience with both of them and we've combined the best features of the two and some of our own ideas.
Not only this, but there's an annoying snag with SHOUTcast and Icecast.
It's also quite difficult to build off of, we're changing that with Cast.
If you want to stem off your own project based on Cast, you can!

The other thing with Icecast and SHOUTcast is the outdated UI. Say goodbye to Web 1.0 with Cast.
We introduce a ***gorgeous*** streaming page with an equally gorgeous UI.

## Limitations

> Nobody's perfect.

(does anyone remember who's famous for singing that?) Anyway, like everything... Cast does have a few downfalls for its humble version 1.0. Listed below are these limitations and alternatives and/or what we're planning to do to eliminate those in upcoming versions.

* *Handling large amounts of listeners*: Big audience? Cast isn't built to cater for large amounts of listeners. For this, it's best to stick with Icecast (we're plannning to accommodate you guys soon!).
* *No support for OGG*: B-_OGG_ OFF! Cast 1.0 doesn't support OGG streaming, we're super sorry about that and of course we are planning to implement this at a later date. Until then, you're best off with Icecast which supports everything OGG.
* *No support for ad insertion*: You must be M _ad_ (get it?) to think we support that yet. Sadly, Cast 1.0 doesn't support the insertion of ads yet. SHOUTcast (or Icecast KH) will do the job nicely.
* *Resource usage*: Cast 1.0 is a little tough on old hardware at the minute. Because Cast is still being streamlined to perfection, it's a little heavy on memory. Whilst load levels won't be severe, you might have better loads using Icecast or SHOUTcast.
* *No support for statistics*: Cast 1.0 currently has no statistics yet. We're working on building these in before the final version.

There's a saying in England, mainly used by distressed mothers to try and get their children to eat their food without complaining.
> If you don't like it, _lump_ it!

Cast is still very much in its baby stages. We're learning how to walk and we'd like you to walk with us. Whilst we're by no means perfect, we're getting there... slowly and with a lot of willpower (and iced tea).
If you don't particularly feel Cast is for you, there's always [SHOUTcast](http://shoutcast.com) and [Icecast](http://icecast.org). Solid and trusted by many.

## Credit

Based off fabulous work done by these wonderful people: [TooTallNate](https://github.com/tootallnate) and [stephen](https://gitub.com/stephen/nicercast).

Thanks to [SHOUTcast](http://shoutcast.com) and [Icecast](http://icecast.org) for the inspiration. We love you guys.

This text you're reading was written by Ethan Gates and might be partially broken by Léo Lam and Maarten Eyskens.
Feel free to correct grammatical mistakes, Ethan's not perfect.

## License

Copyright © 2015-2016  Innovate Technologies (Maartje Eyskens, Léo Lam)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
