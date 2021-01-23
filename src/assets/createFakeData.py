import random

exc = [
    'Follow-up to the comedy series Roseanne (1988), centering on the family members of the matriarch after her sudden death.',
    'A family comedy narrated by Katie, a strong-willed mother, raising her flawed family in a wealthy town filled with perfect wives and their perfect offspring.',
    'An emotional thrill ride through the day-to-day chaos of the city&#8217;s most explosive hospital and the courageous team of doctors who hold it together. They will tackle unique new cases inspired by topical events, forging fiery relationships in the pulse-pounding pandemonium of the emergency room.',
    'A group of bored delinquents are transported to a parallel wasteland as part of a survival game.',
    'Follows a locally born and bred S.W.A.T. lieutenant who is torn between loyalty to the streets and duty to his fellow officers when he&#8217;s tasked to run a highly-trained unit that&#8217;s the last stop for solving crimes in Los Angeles.',
    'A young woman discovers she has the ability to hear the innermost thoughts of people around her as songs and musical numbers.',
    'A police detective in the asteroid belt, the first officer of an interplanetary ice freighter, and an earth-bound United Nations executive slowly discover a vast conspiracy that threatens the Earth&#8217;s rebellious colony on the asteroid belt.'
]

def createData(num: int):

    for idx in range(num):

        html = ''

        for j in range(14):

            SHOW_NAME = f'Show {idx} - {j + 1}'
            THUMBNAIL_SRC = f'https://dummyimage.com/520x245/0{idx + 1:x}0/fff/&text=Page {idx} Item {j + 1}'
            RANDOM_EPISODE = f'S0{random.randint(1, 9)}E0{random.randint(1, 9)}'

            html += f'''
            <article id="post-{random.randint(10000, 99999)}" class="group">
                <div class="post-inner post-hover">
                    <div class="post-thumbnail">
                        <h2 class="post-title" style='text-align:center; font-weight: bold;'>
                            <a href="https://psarips.uk/tv-show/the-conners/" rel="bookmark" title="{SHOW_NAME}">{SHOW_NAME}</a>
                        </h2>
                        <a href="https://psarips.uk/tv-show/the-conners/" title="{SHOW_NAME}">
                            <img width="520" height="245" src="{THUMBNAIL_SRC}" class="attachment-thumb-medium size-thumb-medium wp-post-image" alt="" loading="lazy" />
                        </a>
                        <a class="post-comments" href="https://psarips.uk/tv-show/the-conners/#comments"><span><i class="fa fa-comments-o"></i>12</span></a>
                    </div>
                    <div class="post-meta group">
                        <p class="caption" style='color:RGB(0,102,33);'>Update -> {RANDOM_EPISODE}.720p.webrip</p>
                        <p class="post-category">
                            <a href="https://psarips.uk/category/year/2018/" rel="category tag">2018</a> / 
                            <a href="https://psarips.uk/category/tv-show/comedy-tv-show/" rel="category tag">Comedy</a> / 
                            <a href="https://psarips.uk/category/tv-show/" rel="category tag">TV-Show</a>
                        </p>
                        <p class="post-byline"> &middot; by <a href="https://psarips.uk/author/valhalla/" title="Posts by Valhalla" rel="author">Valhalla</a> &middot; 14 Jan, 2021</p>
                    </div>
                    <div class="entry excerpt" style='text-align:justify;'>
                        <p>{random.choice(exc)}</p>
                    </div>
                </div>
            </article>
            '''

        with open(f'./dataFallback/page{idx}.html', 'w') as outf:
            outf.write(f'<!DOCTYPE html><html><head></head><body>{html}</body></html>')


createData(10)