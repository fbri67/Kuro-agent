# Third-party notices

## Lisensi proyek dan atribusi upstream

Kuro-agent adalah fork/turunan dari [Iky969/Ruko-agent](https://github.com/Iky969/Ruko-agent). Lisensi utama tetap MIT dan pemberitahuan **Copyright (c) 2026 Ruko** dalam [LICENSE](LICENSE) dipertahankan tanpa perubahan. Nama fork tidak memindahkan hak cipta kode upstream.

Dokumen ini menyimpan atribusi dependency secara terpisah. Dokumen ini tidak mengganti LICENSE utama, tidak memberikan lisensi ulang atas komponen pihak ketiga, dan tidak mengklaim kepemilikan komponen tersebut untuk Ruko atau Kuro.

## Cakupan pemeriksaan

Versi npm berikut berasal dari `package-lock.json`; naskah lisensi diperiksa dari paket yang terpasang. Lisensi npm yang tercatat bersifat permisif dan tidak ditemukan kewajiban yang mengharuskan perubahan lisensi utama Ruko. Kewajiban copyright, izin, disclaimer, dan notice masing-masing tetap berlaku.

| Komponen | Versi terkunci | Lisensi | Sumber naskah |
| --- | --- | --- | --- |
| `@babel/parser` | 7.29.9 | MIT | `node_modules/@babel/parser/LICENSE` |
| `@babel/types` | 7.29.8 | MIT | `node_modules/@babel/types/LICENSE` |
| `@babel/helper-string-parser` | 7.29.7 | MIT | `node_modules/@babel/helper-string-parser/LICENSE` |
| `@babel/helper-validator-identifier` | 7.29.7 | MIT | `node_modules/@babel/helper-validator-identifier/LICENSE` |
| `@vscode/ripgrep` | 1.18.0 | MIT | `node_modules/@vscode/ripgrep/LICENSE` |
| Paket binary opsional `@vscode/ripgrep-*` | 1.18.0 | MIT menurut lockfile | LICENSE paket Linux x64 diperiksa; paket platform lain belum diperiksa dari tarball |
| `diff` | 8.0.3 | BSD-3-Clause | `node_modules/diff/LICENSE` |

Binary Linux x64 yang terpasang melaporkan **ripgrep 15.0.0** dan **PCRE2 10.45** dengan JIT. Notice upstream untuk kedua komponen tersebut disertakan di bawah. Metadata lisensi npm bukan inventaris lengkap dependency Rust/C dalam binary. Dokumen ini bukan sertifikasi seluruh dependency native atau seluruh platform; sebelum mendistribusikan binary yang dibundel atau diubah, tinjau inventaris build dan sertakan notice seluruh komponen yang berlaku.

### Dependency pengembangan

| Komponen | Versi terkunci | Lisensi | Notice yang perlu dipertahankan jika tool ikut didistribusikan |
| --- | --- | --- | --- |
| `typescript` | 5.9.3 | Apache-2.0 | `node_modules/typescript/LICENSE.txt` dan `node_modules/typescript/ThirdPartyNoticeText.txt` |
| `@types/node` | 26.6.4 | MIT | `node_modules/@types/node/LICENSE` |
| `undici-types` | 8.9.0 | MIT | `node_modules/undici-types/LICENSE` |

Tool pengembangan dipisahkan dari dependency runtime. Lisensi TypeScript tidak mengganti lisensi kode proyek hanya karena digunakan untuk kompilasi. Jika TypeScript atau materi pihak ketiganya ikut disalin/dibundel, pertahankan lisensi dan third-party notice aslinya, bukan hanya baris ringkasan di tabel ini.

## Ketentuan distribusi

- Sertakan LICENSE utama beserta copyright Ruko pada salinan atau bagian substansial kode proyek.
- Pertahankan lisensi asli dependency saat dependency didistribusikan. Untuk distribusi npm yang memasang dependency terpisah, jangan menghapus LICENSE/notice dari paket dependency.
- Jika melakukan bundling atau distribusi binary, sertakan notice yang berlaku bersama artefak; tautan saja bukan pengganti naskah yang diwajibkan lisensi.
- Jangan memakai nama pemegang copyright BSD atau kontributornya untuk mengesankan endorsement tanpa izin.
- Perbarui dokumen ini ketika versi/dependency/build binary berubah. Lisensi yang belum diketahui atau inventaris binary yang belum ditinjau harus diselesaikan sebelum distribusi terkait.

## @babel/parser — MIT

Sumber: paket `@babel/parser@7.29.9`, file LICENSE.

```text
Copyright (C) 2012-2014 by various contributors (see AUTHORS)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## @babel/types dan helper Babel — MIT

Naskah berikut identik pada LICENSE `@babel/types@7.29.8`, `@babel/helper-string-parser@7.29.7`, dan `@babel/helper-validator-identifier@7.29.7`.

```text
MIT License

Copyright (c) 2014-present Sebastian McKenzie and other contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

## @vscode/ripgrep dan paket binary Linux x64 — MIT

Naskah berikut identik pada LICENSE `@vscode/ripgrep@1.18.0` dan `@vscode/ripgrep-linux-x64@1.18.0` yang terpasang.

```text
vscode-ripgrep

Copyright (c) Microsoft Corporation

All rights reserved.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the ""Software""), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

## ripgrep 15.0.0 — MIT

Sumber upstream: [COPYING](https://github.com/BurntSushi/ripgrep/blob/15.0.0/COPYING) dan [LICENSE-MIT](https://github.com/BurntSushi/ripgrep/blob/15.0.0/LICENSE-MIT). Upstream menawarkan pilihan Unlicense atau MIT; notice berikut mempertahankan jalur MIT.

```text
The MIT License (MIT)

Copyright (c) 2015 Andrew Gallant

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## PCRE2 10.45 — BSD-3-Clause WITH PCRE2-exception

Sumber upstream: [LICENCE.md pada tag pcre2-10.45](https://github.com/PCRE2Project/pcre2/blob/pcre2-10.45/LICENCE.md). Naskah di bawah mempertahankan pengecualian upstream untuk rantai distribusi binary; pengecualian itu bukan perubahan lisensi proyek Ruko.

```text
PCRE2 License
=============

| SPDX-License-Identifier: | BSD-3-Clause WITH PCRE2-exception |
|---------|-------|

PCRE2 is a library of functions to support regular expressions whose syntax
and semantics are as close as possible to those of the Perl 5 language.

Releases 10.00 and above of PCRE2 are distributed under the terms of the "BSD"
licence, as specified below, with one exemption for certain binary
redistributions. The documentation for PCRE2, supplied in the "doc" directory,
is distributed under the same terms as the software itself. The data in the
testdata directory is not copyrighted and is in the public domain.

The basic library functions are written in C and are freestanding. Also
included in the distribution is a just-in-time compiler that can be used to
optimize pattern matching. This is an optional feature that can be omitted when
the library is built.


COPYRIGHT
---------

### The basic library functions

    Written by:       Philip Hazel
    Email local part: Philip.Hazel
    Email domain:     gmail.com

    Retired from University of Cambridge Computing Service,
    Cambridge, England.

    Copyright (c) 1997-2007 University of Cambridge
    Copyright (c) 2007-2024 Philip Hazel
    All rights reserved.

### PCRE2 Just-In-Time compilation support

    Written by:       Zoltan Herczeg
    Email local part: hzmester
    Email domain:     freemail.hu

    Copyright (c) 2010-2024 Zoltan Herczeg
    All rights reserved.

### Stack-less Just-In-Time compiler

    Written by:       Zoltan Herczeg
    Email local part: hzmester
    Email domain:     freemail.hu

    Copyright (c) 2009-2024 Zoltan Herczeg
    All rights reserved.

### All other contributions

Many other contributors have participated in the authorship of PCRE2. As PCRE2
has never required a Contributor Licensing Agreement, or other copyright
assignment agreement, all contributions have copyright retained by each
original contributor or their employer.


THE "BSD" LICENCE
-----------------

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notices,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright
  notices, this list of conditions and the following disclaimer in the
  documentation and/or other materials provided with the distribution.

* Neither the name of the University of Cambridge nor the names of any
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.


EXEMPTION FOR BINARY LIBRARY-LIKE PACKAGES
------------------------------------------

The second condition in the BSD licence (covering binary redistributions) does
not apply all the way down a chain of software. If binary package A includes
PCRE2, it must respect the condition, but if package B is software that
includes package A, the condition is not imposed on package B unless it uses
PCRE2 independently.

End
```

## diff — BSD-3-Clause

Sumber: paket `diff@8.0.3`, file LICENSE.

```text
BSD 3-Clause License

Copyright (c) 2009-2015, Kevin Decker <kpdecker@gmail.com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```
