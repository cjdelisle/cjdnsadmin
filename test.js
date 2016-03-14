/* vim: set expandtab ts=4 sw=4: */
/*
 * You may redistribute this program and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';

const Cjdnskeys = require('./index');
const assert = (x) => { if (!x) { throw new Error(); } };
assert(Cjdnskeys.validate("378813dfecc62185ffab4d00030b55f50b54e515bfcea8b41f2bd1c2511bae03"));
assert(Cjdnskeys.validate("vustvs4mcvv2mmq863lw9kb84thw1t3s745pmwcmmb36l0sfvb60.k"));
assert(!Cjdnskeys.validate("378813dfecc62185ffab4d00030b55f50b54e515bfcea8b41f2bd1c2511bae10"));
assert(Cjdnskeys.validate("fcac:95ca:6ead:eaa8:f5c4:f455:0d71:faff"));
assert(!Cjdnskeys.validate("73ac:95ca:6ead:eaa8:f5c4:f455:0d71:faff"));
