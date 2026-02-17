/*
<Card
              shadow='none'
              radius='none'
              className='hidden rounded-3xl border border-foreground/20 bg-content1/50 backdrop-blur-sm'>
              <CardBody className='p-0'>
                <div className='px-6 py-4'>
                  <h3 className='font-semibold font-nito text-base tracking-tight'>
                    Member Benefits
                  </h3>
                </div>
                <div className='p-4 space-y-2'>
                  {tierBenefits?.discountPercentage ? (
                    <div className='flex items-center gap-3 p-4 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/30 transition-all hover:bg-green-50 dark:hover:bg-green-900/20'>
                      <div className='p-2.5 rounded-xl bg-green-500/20 text-green-600 dark:text-green-400'>
                        <Icon name='percent' className='size-4.5' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-semibold text-green-700 dark:text-green-400'>
                          {tierBenefits.discountPercentage}% OFF
                        </p>
                        <p className='text-xs text-default-500 mt-0.5'>
                          On all orders
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {tierBenefits?.freeShipping && (
                    <div className='flex items-center gap-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20'>
                      <div className='p-2.5 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400'>
                        <Icon name='truck' className='size-4.5' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-semibold text-blue-700 dark:text-blue-400'>
                          Free Shipping
                        </p>
                        <p className='text-xs text-default-500 mt-0.5'>
                          On all eligible orders
                        </p>
                      </div>
                    </div>
                  )}
                  <Callout
                    title='Member Access'
                    description='Benefits and perks.'
                    icon='user'
                  />
                </div>
              </CardBody>
            </Card>
*/

/*
{rewards?.nextTier && (
              <Card
                shadow='none'
                className='border border-foreground/20 backdrop-blur-sm'>
                <CardBody className='p-6 space-y-5'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2.5'>
                      <div className='p-2 rounded-xl bg-primary/20'>
                        <Icon
                          name='star-fill'
                          className='size-5 text-primary'
                        />
                      </div>
                      <h3 className='font-semibold font-nito text-base tracking-tight'>
                        Next Reward Tier
                      </h3>
                    </div>
                    <Chip
                      size='sm'
                      variant='flat'
                      className='bg-primary/20 text-primary font-nito font-semibold'>
                      {rewards.nextTier.name}
                    </Chip>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-default-600 dark:text-default-400 font-medium'>
                        Progress
                      </span>
                      <span className='font-bold text-primary'>
                        {Math.round(nextTierProgress)}%
                      </span>
                    </div>
                    <Progress
                      value={nextTierProgress}
                      color='secondary'
                      className='h-2.5'
                      classNames={{
                        indicator:
                          'bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500',
                      }}
                    />
                    <p className='text-xs text-default-500 text-center leading-relaxed pt-1'>
                      Spend{' '}
                      <span className='font-bold text-foreground'>
                        ${formatPrice(spendToNextTier)}
                      </span>{' '}
                      more to reach{' '}
                      <span className='font-semibold text-primary'>
                        {rewards.nextTier.name}
                      </span>{' '}
                      status
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}
*/
